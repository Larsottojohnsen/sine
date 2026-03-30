"""
Library API Routes – dokument-upload og LightRAG-indeksering
POST /api/library/upload  – last opp dokument for indeksering
GET  /api/library/docs    – hent indekserte dokumenter for bruker
DELETE /api/library/docs/{id} – slett dokument
POST /api/library/query   – søk i indekserte dokumenter
"""
from __future__ import annotations
import os
import uuid
import tempfile
from typing import Optional
from pathlib import Path

from fastapi import APIRouter, Header, HTTPException, UploadFile, File
from pydantic import BaseModel
from supabase import create_client

router = APIRouter(prefix="/api/library", tags=["library"])

SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")
LIGHTRAG_URL = os.getenv("LIGHTRAG_URL", "")  # Railway-deployed LightRAG

ALLOWED_EXTENSIONS = {'.pdf', '.docx', '.doc', '.txt', '.md', '.csv', '.xlsx'}
MAX_FILE_SIZE = 50 * 1024 * 1024  # 50 MB


def _get_supabase():
    return create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)


def _get_user_id(x_user_id: Optional[str]) -> str:
    return x_user_id or "default"


class QueryRequest(BaseModel):
    query: str
    limit: Optional[int] = 5


# ── POST /api/library/upload ─────────────────────────────────────────────────
@router.post("/upload")
async def upload_document(
    file: UploadFile = File(...),
    x_user_id: Optional[str] = Header(default=None)
):
    """Last opp et dokument og indekser det med LightRAG"""
    user_id = _get_user_id(x_user_id)

    # Valider filtype
    suffix = Path(file.filename or "").suffix.lower()
    if suffix not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Filtype ikke støttet: {suffix}. Tillatte: {', '.join(ALLOWED_EXTENSIONS)}"
        )

    # Les filinnhold
    content = await file.read()
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(status_code=413, detail="Filen er for stor (maks 50 MB)")

    doc_id = str(uuid.uuid4())

    # Lagre metadata i Supabase
    try:
        sb = _get_supabase()
        sb.table("library_documents").insert({
            "id": doc_id,
            "user_id": user_id,
            "filename": file.filename,
            "file_type": suffix.lstrip('.'),
            "file_size": len(content),
            "status": "uploaded",
        }).execute()
    except Exception as e:
        print(f"[library] Supabase insert error: {e}")
        # Fortsett selv om Supabase feiler

    # Send til LightRAG for indeksering (hvis tilgjengelig)
    if LIGHTRAG_URL:
        try:
            import httpx
            async with httpx.AsyncClient(timeout=60) as client:
                files_payload = {"file": (file.filename, content, file.content_type or "application/octet-stream")}
                data_payload = {"user_id": user_id, "doc_id": doc_id}
                resp = await client.post(
                    f"{LIGHTRAG_URL}/index",
                    files=files_payload,
                    data=data_payload,
                )
                if resp.status_code == 200:
                    # Oppdater status til 'indexed'
                    try:
                        sb = _get_supabase()
                        sb.table("library_documents").update({"status": "indexed"}).eq("id", doc_id).execute()
                    except Exception:
                        pass
        except Exception as e:
            print(f"[library] LightRAG indexing error: {e}")
            # Ikke krasj — dokumentet er lagret, bare ikke indeksert ennå

    return {
        "id": doc_id,
        "filename": file.filename,
        "size": len(content),
        "status": "uploaded" if not LIGHTRAG_URL else "indexing",
        "message": "Dokument lastet opp" + (" og sendt til indeksering" if LIGHTRAG_URL else "")
    }


# ── GET /api/library/docs ────────────────────────────────────────────────────
@router.get("/docs")
async def get_documents(x_user_id: Optional[str] = Header(default=None)):
    """Hent alle indekserte dokumenter for brukeren"""
    user_id = _get_user_id(x_user_id)
    try:
        sb = _get_supabase()
        result = sb.table("library_documents") \
            .select("id, filename, file_type, file_size, status, created_at") \
            .eq("user_id", user_id) \
            .order("created_at", desc=True) \
            .execute()
        return {"documents": result.data or []}
    except Exception as e:
        print(f"[library] get_documents error: {e}")
        return {"documents": []}


# ── DELETE /api/library/docs/{id} ────────────────────────────────────────────
@router.delete("/docs/{doc_id}")
async def delete_document(
    doc_id: str,
    x_user_id: Optional[str] = Header(default=None)
):
    """Slett et dokument"""
    user_id = _get_user_id(x_user_id)
    try:
        sb = _get_supabase()
        sb.table("library_documents") \
            .delete() \
            .eq("id", doc_id) \
            .eq("user_id", user_id) \
            .execute()

        # Slett fra LightRAG hvis tilgjengelig
        if LIGHTRAG_URL:
            try:
                import httpx
                async with httpx.AsyncClient(timeout=10) as client:
                    await client.delete(f"{LIGHTRAG_URL}/docs/{doc_id}")
            except Exception:
                pass

        return {"status": "deleted"}
    except Exception as e:
        print(f"[library] delete_document error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ── POST /api/library/query ──────────────────────────────────────────────────
@router.post("/query")
async def query_documents(
    req: QueryRequest,
    x_user_id: Optional[str] = Header(default=None)
):
    """Søk i indekserte dokumenter med LightRAG"""
    user_id = _get_user_id(x_user_id)

    if not LIGHTRAG_URL:
        return {"results": [], "message": "LightRAG ikke konfigurert"}

    try:
        import httpx
        async with httpx.AsyncClient(timeout=30) as client:
            resp = await client.post(
                f"{LIGHTRAG_URL}/query",
                json={"query": req.query, "user_id": user_id, "limit": req.limit}
            )
            if resp.status_code == 200:
                return resp.json()
            return {"results": [], "error": f"LightRAG feil: {resp.status_code}"}
    except Exception as e:
        print(f"[library] query_documents error: {e}")
        return {"results": [], "error": str(e)}
