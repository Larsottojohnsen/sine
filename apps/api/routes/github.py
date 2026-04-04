"""
GitHub OAuth Routes
GET    /api/github/auth-url     – generer OAuth URL for GitHub
GET    /api/github/callback     – OAuth callback, lagre tokens
GET    /api/github/status       – sjekk om bruker er koblet til GitHub
DELETE /api/github/disconnect   – koble fra GitHub
GET    /api/github/repos        – list brukerens repoer
POST   /api/github/file         – les en fil fra et repo
POST   /api/github/push         – push en fil til et repo
POST   /api/github/create-repo  – opprett nytt repo
"""
from __future__ import annotations
import os
import json
import base64
import urllib.parse
from typing import Optional
from fastapi import APIRouter, Header, HTTPException, Query
from fastapi.responses import RedirectResponse
from pydantic import BaseModel
from supabase import create_client

router = APIRouter(prefix="/api/github", tags=["github"])

# ── GitHub OAuth konfigurasjon ────────────────────────────────────────────────
GITHUB_CLIENT_ID     = os.getenv("GITHUB_CLIENT_ID", "")
GITHUB_CLIENT_SECRET = os.getenv("GITHUB_CLIENT_SECRET", "")
FRONTEND_URL         = os.getenv("FRONTEND_URL", "https://larsottojohnsen.github.io/sine")
BACKEND_URL          = os.getenv("BACKEND_URL", "https://sineapi-production-8db6.up.railway.app")

GITHUB_AUTH_URL  = "https://github.com/login/oauth/authorize"
GITHUB_TOKEN_URL = "https://github.com/login/oauth/access_token"
GITHUB_API_URL   = "https://api.github.com"

GITHUB_SCOPES = "repo,read:user,user:email"

SUPABASE_URL         = os.getenv("SUPABASE_URL", "")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")


def _get_supabase():
    return create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)


def _get_user_id(x_user_id: Optional[str]) -> str:
    return x_user_id or "default"


class PushFileRequest(BaseModel):
    repo: str          # "owner/repo"
    path: str          # "src/main.py"
    content: str       # file content (plain text)
    message: str       # commit message
    branch: str = "main"
    user_id: Optional[str] = None


class ReadFileRequest(BaseModel):
    repo: str
    path: str
    ref: str = "main"
    user_id: Optional[str] = None


class CreateRepoRequest(BaseModel):
    name: str
    description: str = ""
    private: bool = True
    user_id: Optional[str] = None


# ── GET /api/github/auth-url ─────────────────────────────────────────────────
@router.get("/auth-url")
async def get_auth_url(x_user_id: Optional[str] = Header(default=None)):
    """Generer GitHub OAuth URL"""
    # Hent client_id fra env eller fra databasen (admin-lagret)
    client_id = GITHUB_CLIENT_ID
    if not client_id:
        # Prøv å hente fra admin_settings i databasen
        try:
            sb = _get_supabase()
            res = sb.table("admin_settings").select("value").eq("key", "github_client_id").execute()
            if res.data:
                client_id = res.data[0]["value"]
        except Exception:
            pass
    if not client_id:
        raise HTTPException(status_code=503, detail="GitHub OAuth ikke konfigurert (mangler Client ID)")

    user_id = _get_user_id(x_user_id)
    state = base64.urlsafe_b64encode(json.dumps({"user_id": user_id}).encode()).decode()
    params = {
        "client_id": client_id,
        "redirect_uri": f"{BACKEND_URL}/api/github/callback",
        "scope": GITHUB_SCOPES,
        "state": state,
    }
    url = f"{GITHUB_AUTH_URL}?{urllib.parse.urlencode(params)}"
    return {"auth_url": url}


# ── GET /api/github/callback ─────────────────────────────────────────────────
@router.get("/callback")
async def github_callback(
    code: str = Query(...),
    state: str = Query(...),
    error: Optional[str] = Query(default=None),
):
    """OAuth callback fra GitHub"""
    if error:
        return RedirectResponse(f"{FRONTEND_URL}?github_error={error}")

    # Dekod state
    try:
        state_data = json.loads(base64.urlsafe_b64decode(state + "==").decode())
        user_id = state_data.get("user_id", "default")
    except Exception:
        user_id = "default"

    # Hent client credentials
    client_id     = GITHUB_CLIENT_ID
    client_secret = GITHUB_CLIENT_SECRET
    if not client_id or not client_secret:
        try:
            sb = _get_supabase()
            res_id  = sb.table("admin_settings").select("value").eq("key", "github_client_id").execute()
            res_sec = sb.table("admin_settings").select("value").eq("key", "github_client_secret").execute()
            if res_id.data:
                client_id = res_id.data[0]["value"]
            if res_sec.data:
                client_secret = res_sec.data[0]["value"]
        except Exception:
            pass

    if not client_id or not client_secret:
        return RedirectResponse(f"{FRONTEND_URL}?github_error=not_configured")

    # Bytt code mot access_token
    try:
        import httpx
        async with httpx.AsyncClient() as client:
            resp = await client.post(
                GITHUB_TOKEN_URL,
                headers={"Accept": "application/json"},
                data={
                    "client_id":     client_id,
                    "client_secret": client_secret,
                    "code":          code,
                    "redirect_uri":  f"{BACKEND_URL}/api/github/callback",
                },
            )
            token_data = resp.json()
    except Exception as e:
        print(f"[github] token exchange error: {e}")
        return RedirectResponse(f"{FRONTEND_URL}?github_error=token_exchange_failed")

    access_token = token_data.get("access_token")
    if not access_token:
        return RedirectResponse(f"{FRONTEND_URL}?github_error=no_access_token")

    # Hent GitHub-brukerinfo
    try:
        import httpx
        async with httpx.AsyncClient() as client:
            user_resp = await client.get(
                f"{GITHUB_API_URL}/user",
                headers={"Authorization": f"Bearer {access_token}", "Accept": "application/json"},
            )
            github_user = user_resp.json()
    except Exception as e:
        print(f"[github] user info error: {e}")
        github_user = {}

    # Lagre token i Supabase
    try:
        sb = _get_supabase()
        sb.table("github_tokens").upsert({
            "user_id":       user_id,
            "access_token":  access_token,
            "token_type":    token_data.get("token_type", "bearer"),
            "scope":         token_data.get("scope", ""),
            "github_login":  github_user.get("login", ""),
            "github_name":   github_user.get("name", ""),
            "github_avatar": github_user.get("avatar_url", ""),
        }, on_conflict="user_id").execute()
    except Exception as e:
        print(f"[github] save token error: {e}")
        return RedirectResponse(f"{FRONTEND_URL}?github_error=save_failed")

    return RedirectResponse(f"{FRONTEND_URL}?github_connected=true")


# ── GET /api/github/status ───────────────────────────────────────────────────
@router.get("/status")
async def github_status(x_user_id: Optional[str] = Header(default=None)):
    """Sjekk om bruker er koblet til GitHub"""
    user_id = _get_user_id(x_user_id)
    try:
        sb = _get_supabase()
        result = sb.table("github_tokens").select("github_login,github_name,github_avatar,scope").eq("user_id", user_id).execute()
        if result.data:
            row = result.data[0]
            return {
                "connected": True,
                "login":     row.get("github_login", ""),
                "name":      row.get("github_name", ""),
                "avatar":    row.get("github_avatar", ""),
                "scope":     row.get("scope", ""),
            }
        return {"connected": False}
    except Exception as e:
        print(f"[github] status error: {e}")
        return {"connected": False}


# ── DELETE /api/github/disconnect ────────────────────────────────────────────
@router.delete("/disconnect")
async def github_disconnect(x_user_id: Optional[str] = Header(default=None)):
    """Koble fra GitHub"""
    user_id = _get_user_id(x_user_id)
    try:
        sb = _get_supabase()
        sb.table("github_tokens").delete().eq("user_id", user_id).execute()
        return {"status": "disconnected"}
    except Exception as e:
        print(f"[github] disconnect error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ── Intern helper: hent access token ─────────────────────────────────────────
async def _get_access_token(user_id: str) -> str:
    sb = _get_supabase()
    result = sb.table("github_tokens").select("access_token").eq("user_id", user_id).execute()
    if not result.data:
        raise HTTPException(status_code=401, detail="GitHub ikke koblet til")
    return result.data[0]["access_token"]


# ── GET /api/github/repos ────────────────────────────────────────────────────
@router.get("/repos")
async def list_repos(
    x_user_id: Optional[str] = Header(default=None),
    per_page: int = Query(default=30),
    page: int = Query(default=1),
):
    """List brukerens GitHub-repoer"""
    user_id = _get_user_id(x_user_id)
    access_token = await _get_access_token(user_id)
    try:
        import httpx
        async with httpx.AsyncClient() as client:
            resp = await client.get(
                f"{GITHUB_API_URL}/user/repos",
                headers={"Authorization": f"Bearer {access_token}", "Accept": "application/json"},
                params={"per_page": per_page, "page": page, "sort": "updated"},
            )
            repos = resp.json()
        return {"repos": [
            {
                "id":          r["id"],
                "name":        r["name"],
                "full_name":   r["full_name"],
                "description": r.get("description", ""),
                "private":     r["private"],
                "default_branch": r.get("default_branch", "main"),
                "updated_at":  r.get("updated_at", ""),
                "url":         r.get("html_url", ""),
            }
            for r in repos if isinstance(r, dict)
        ]}
    except Exception as e:
        print(f"[github] list_repos error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ── POST /api/github/file ────────────────────────────────────────────────────
@router.post("/file")
async def read_file(
    req: ReadFileRequest,
    x_user_id: Optional[str] = Header(default=None),
):
    """Les en fil fra et GitHub-repo"""
    user_id = _get_user_id(x_user_id) or req.user_id or "default"
    access_token = await _get_access_token(user_id)
    try:
        import httpx
        async with httpx.AsyncClient() as client:
            resp = await client.get(
                f"{GITHUB_API_URL}/repos/{req.repo}/contents/{req.path}",
                headers={"Authorization": f"Bearer {access_token}", "Accept": "application/json"},
                params={"ref": req.ref},
            )
            data = resp.json()
        if "content" not in data:
            raise HTTPException(status_code=404, detail=f"Fil ikke funnet: {req.path}")
        content = base64.b64decode(data["content"]).decode("utf-8", errors="replace")
        return {
            "path":    data.get("path", req.path),
            "content": content,
            "sha":     data.get("sha", ""),
            "size":    data.get("size", 0),
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"[github] read_file error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ── POST /api/github/push ────────────────────────────────────────────────────
@router.post("/push")
async def push_file(
    req: PushFileRequest,
    x_user_id: Optional[str] = Header(default=None),
):
    """Push (opprett eller oppdater) en fil i et GitHub-repo"""
    user_id = _get_user_id(x_user_id) or req.user_id or "default"
    access_token = await _get_access_token(user_id)
    try:
        import httpx
        headers = {"Authorization": f"Bearer {access_token}", "Accept": "application/json"}
        content_b64 = base64.b64encode(req.content.encode()).decode()

        # Sjekk om filen allerede eksisterer (for å hente sha)
        existing_sha = None
        async with httpx.AsyncClient() as client:
            check = await client.get(
                f"{GITHUB_API_URL}/repos/{req.repo}/contents/{req.path}",
                headers=headers,
                params={"ref": req.branch},
            )
            if check.status_code == 200:
                existing_sha = check.json().get("sha")

        # Push filen
        payload: dict = {
            "message": req.message,
            "content": content_b64,
            "branch":  req.branch,
        }
        if existing_sha:
            payload["sha"] = existing_sha

        async with httpx.AsyncClient() as client:
            resp = await client.put(
                f"{GITHUB_API_URL}/repos/{req.repo}/contents/{req.path}",
                headers=headers,
                json=payload,
            )
            result = resp.json()

        if resp.status_code not in (200, 201):
            raise HTTPException(status_code=resp.status_code, detail=result.get("message", "GitHub push feilet"))

        return {
            "status":  "pushed",
            "path":    req.path,
            "commit":  result.get("commit", {}).get("sha", ""),
            "url":     result.get("content", {}).get("html_url", ""),
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"[github] push_file error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ── POST /api/github/create-repo ─────────────────────────────────────────────
@router.post("/create-repo")
async def create_repo(
    req: CreateRepoRequest,
    x_user_id: Optional[str] = Header(default=None),
):
    """Opprett et nytt GitHub-repo"""
    user_id = _get_user_id(x_user_id) or req.user_id or "default"
    access_token = await _get_access_token(user_id)
    try:
        import httpx
        async with httpx.AsyncClient() as client:
            resp = await client.post(
                f"{GITHUB_API_URL}/user/repos",
                headers={"Authorization": f"Bearer {access_token}", "Accept": "application/json"},
                json={
                    "name":        req.name,
                    "description": req.description,
                    "private":     req.private,
                    "auto_init":   True,
                },
            )
            result = resp.json()
        if resp.status_code not in (200, 201):
            raise HTTPException(status_code=resp.status_code, detail=result.get("message", "Opprettelse feilet"))
        return {
            "status":    "created",
            "full_name": result.get("full_name", ""),
            "url":       result.get("html_url", ""),
            "clone_url": result.get("clone_url", ""),
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"[github] create_repo error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
