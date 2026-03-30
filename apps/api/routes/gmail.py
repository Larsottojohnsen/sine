"""
Gmail OAuth Routes
GET  /api/gmail/auth-url     – generer OAuth URL for Gmail
GET  /api/gmail/callback     – OAuth callback, lagre tokens
GET  /api/gmail/status       – sjekk om bruker er koblet til Gmail
DELETE /api/gmail/disconnect – koble fra Gmail
GET  /api/gmail/messages     – hent e-poster (for agent-kontekst)
POST /api/gmail/send         – send e-post via Gmail
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

router = APIRouter(prefix="/api/gmail", tags=["gmail"])

# ── Google OAuth konfigurasjon ────────────────────────────────────────────────
GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID", "")
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET", "")
FRONTEND_URL = os.getenv("FRONTEND_URL", "https://larsottojohnsen.github.io/sine")
BACKEND_URL = os.getenv("BACKEND_URL", "https://sineapi-production-8db6.up.railway.app")

GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth"
GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"
GOOGLE_SCOPES = [
    "https://www.googleapis.com/auth/gmail.readonly",
    "https://www.googleapis.com/auth/gmail.send",
    "https://www.googleapis.com/auth/gmail.modify",
]

SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")


def _get_supabase():
    return create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)


def _get_user_id(x_user_id: Optional[str]) -> str:
    return x_user_id or "default"


class SendEmailRequest(BaseModel):
    to: str
    subject: str
    body: str
    user_id: Optional[str] = None


# ── GET /api/gmail/auth-url ──────────────────────────────────────────────────
@router.get("/auth-url")
async def get_auth_url(x_user_id: Optional[str] = Header(default=None)):
    """Generer Google OAuth URL"""
    if not GOOGLE_CLIENT_ID:
        raise HTTPException(status_code=503, detail="Gmail OAuth ikke konfigurert (mangler GOOGLE_CLIENT_ID)")

    user_id = _get_user_id(x_user_id)
    state = base64.urlsafe_b64encode(json.dumps({"user_id": user_id}).encode()).decode()

    params = {
        "client_id": GOOGLE_CLIENT_ID,
        "redirect_uri": f"{BACKEND_URL}/api/gmail/callback",
        "response_type": "code",
        "scope": " ".join(GOOGLE_SCOPES),
        "access_type": "offline",
        "prompt": "consent",
        "state": state,
    }

    url = f"{GOOGLE_AUTH_URL}?{urllib.parse.urlencode(params)}"
    return {"auth_url": url}


# ── GET /api/gmail/callback ──────────────────────────────────────────────────
@router.get("/callback")
async def gmail_callback(
    code: str = Query(...),
    state: str = Query(...),
    error: Optional[str] = Query(default=None)
):
    """OAuth callback fra Google"""
    if error:
        return RedirectResponse(f"{FRONTEND_URL}?gmail_error={error}")

    # Dekod state for å hente user_id
    try:
        state_data = json.loads(base64.urlsafe_b64decode(state + "==").decode())
        user_id = state_data.get("user_id", "default")
    except Exception:
        user_id = "default"

    # Bytt code mot tokens
    try:
        import httpx
        async with httpx.AsyncClient() as client:
            resp = await client.post(GOOGLE_TOKEN_URL, data={
                "code": code,
                "client_id": GOOGLE_CLIENT_ID,
                "client_secret": GOOGLE_CLIENT_SECRET,
                "redirect_uri": f"{BACKEND_URL}/api/gmail/callback",
                "grant_type": "authorization_code",
            })
            tokens = resp.json()

        if "error" in tokens:
            return RedirectResponse(f"{FRONTEND_URL}?gmail_error={tokens['error']}")

        # Lagre tokens i Supabase
        sb = _get_supabase()
        sb.table("gmail_tokens").upsert({
            "user_id": user_id,
            "access_token": tokens.get("access_token"),
            "refresh_token": tokens.get("refresh_token"),
            "token_type": tokens.get("token_type", "Bearer"),
            "expires_in": tokens.get("expires_in", 3600),
            "scope": tokens.get("scope", ""),
        }, on_conflict="user_id").execute()

        return RedirectResponse(f"{FRONTEND_URL}?gmail_connected=true")

    except Exception as e:
        print(f"[gmail] callback error: {e}")
        return RedirectResponse(f"{FRONTEND_URL}?gmail_error=server_error")


# ── GET /api/gmail/status ────────────────────────────────────────────────────
@router.get("/status")
async def gmail_status(x_user_id: Optional[str] = Header(default=None)):
    """Sjekk om bruker er koblet til Gmail"""
    user_id = _get_user_id(x_user_id)
    try:
        sb = _get_supabase()
        result = sb.table("gmail_tokens") \
            .select("user_id, scope, created_at") \
            .eq("user_id", user_id) \
            .execute()
        connected = bool(result.data)
        return {"connected": connected, "user_id": user_id}
    except Exception:
        return {"connected": False}


# ── DELETE /api/gmail/disconnect ─────────────────────────────────────────────
@router.delete("/disconnect")
async def gmail_disconnect(x_user_id: Optional[str] = Header(default=None)):
    """Koble fra Gmail"""
    user_id = _get_user_id(x_user_id)
    try:
        sb = _get_supabase()
        sb.table("gmail_tokens").delete().eq("user_id", user_id).execute()
        return {"status": "disconnected"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


async def _get_access_token(user_id: str) -> str:
    """Hent (og forny om nødvendig) access token for brukeren"""
    sb = _get_supabase()
    result = sb.table("gmail_tokens").select("*").eq("user_id", user_id).execute()
    if not result.data:
        raise HTTPException(status_code=401, detail="Gmail ikke koblet til")

    token_data = result.data[0]
    access_token = token_data.get("access_token")
    refresh_token = token_data.get("refresh_token")

    # Prøv å bruke access token — forny hvis nødvendig
    if refresh_token and GOOGLE_CLIENT_ID:
        try:
            import httpx
            async with httpx.AsyncClient() as client:
                resp = await client.post(GOOGLE_TOKEN_URL, data={
                    "client_id": GOOGLE_CLIENT_ID,
                    "client_secret": GOOGLE_CLIENT_SECRET,
                    "refresh_token": refresh_token,
                    "grant_type": "refresh_token",
                })
                new_tokens = resp.json()
                if "access_token" in new_tokens:
                    access_token = new_tokens["access_token"]
                    sb.table("gmail_tokens").update({
                        "access_token": access_token,
                        "expires_in": new_tokens.get("expires_in", 3600),
                    }).eq("user_id", user_id).execute()
        except Exception as e:
            print(f"[gmail] token refresh error: {e}")

    return access_token


# ── GET /api/gmail/messages ──────────────────────────────────────────────────
@router.get("/messages")
async def get_messages(
    query: str = Query(default=""),
    max_results: int = Query(default=10),
    x_user_id: Optional[str] = Header(default=None)
):
    """Hent e-poster fra Gmail (for agent-kontekst)"""
    user_id = _get_user_id(x_user_id)
    access_token = await _get_access_token(user_id)

    try:
        import httpx
        headers = {"Authorization": f"Bearer {access_token}"}

        async with httpx.AsyncClient() as client:
            # List meldinger
            params = {"maxResults": max_results, "q": query or "is:unread"}
            list_resp = await client.get(
                "https://gmail.googleapis.com/gmail/v1/users/me/messages",
                headers=headers,
                params=params
            )
            list_data = list_resp.json()

            messages = []
            for msg_ref in (list_data.get("messages") or [])[:max_results]:
                msg_resp = await client.get(
                    f"https://gmail.googleapis.com/gmail/v1/users/me/messages/{msg_ref['id']}",
                    headers=headers,
                    params={"format": "metadata", "metadataHeaders": ["Subject", "From", "Date"]}
                )
                msg_data = msg_resp.json()

                # Trekk ut headers
                headers_list = msg_data.get("payload", {}).get("headers", [])
                subject = next((h["value"] for h in headers_list if h["name"] == "Subject"), "(Ingen emne)")
                from_addr = next((h["value"] for h in headers_list if h["name"] == "From"), "")
                date = next((h["value"] for h in headers_list if h["name"] == "Date"), "")
                snippet = msg_data.get("snippet", "")

                messages.append({
                    "id": msg_ref["id"],
                    "subject": subject,
                    "from": from_addr,
                    "date": date,
                    "snippet": snippet,
                })

        return {"messages": messages}

    except Exception as e:
        print(f"[gmail] get_messages error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ── POST /api/gmail/send ─────────────────────────────────────────────────────
@router.post("/send")
async def send_email(
    req: SendEmailRequest,
    x_user_id: Optional[str] = Header(default=None)
):
    """Send e-post via Gmail"""
    user_id = _get_user_id(x_user_id) or req.user_id or "default"
    access_token = await _get_access_token(user_id)

    try:
        import httpx
        # Bygg RFC 2822 melding
        message = f"To: {req.to}\r\nSubject: {req.subject}\r\nContent-Type: text/plain; charset=utf-8\r\n\r\n{req.body}"
        raw = base64.urlsafe_b64encode(message.encode()).decode()

        async with httpx.AsyncClient() as client:
            resp = await client.post(
                "https://gmail.googleapis.com/gmail/v1/users/me/messages/send",
                headers={"Authorization": f"Bearer {access_token}", "Content-Type": "application/json"},
                json={"raw": raw}
            )
            result = resp.json()

        if "id" in result:
            return {"status": "sent", "message_id": result["id"]}
        else:
            raise HTTPException(status_code=500, detail=f"Gmail feil: {result}")

    except HTTPException:
        raise
    except Exception as e:
        print(f"[gmail] send_email error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
