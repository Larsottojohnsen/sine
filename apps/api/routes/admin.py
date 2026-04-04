"""
Admin Routes — bruker service role key for å omgå RLS
POST   /api/admin/settings        – lagre en innstilling (nøkkel/verdi)
GET    /api/admin/settings/{key}  – hent en innstilling
POST   /api/admin/settings/batch  – lagre flere innstillinger på én gang
"""
from __future__ import annotations
import os
from typing import Optional
from fastapi import APIRouter, Header, HTTPException
from pydantic import BaseModel
from supabase import create_client

router = APIRouter(prefix="/api/admin", tags=["admin"])

SUPABASE_URL         = os.getenv("SUPABASE_URL", "")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")
ADMIN_SECRET         = os.getenv("ADMIN_SECRET", "")  # optional extra protection


def _get_supabase():
    return create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)


def _check_admin(x_user_id: Optional[str]):
    """Enkel admin-sjekk — kan utvides med JWT-validering"""
    if not x_user_id:
        raise HTTPException(status_code=401, detail="Ikke autentisert")


class SaveSettingRequest(BaseModel):
    key: str
    value: str


class BatchSaveRequest(BaseModel):
    settings: list[SaveSettingRequest]


# ── POST /api/admin/settings ─────────────────────────────────────────────────
@router.post("/settings")
async def save_setting(
    req: SaveSettingRequest,
    x_user_id: Optional[str] = Header(default=None),
    x_admin_id: Optional[str] = Header(default=None),
):
    """Lagre en innstilling med service role key (omgår RLS)"""
    user_id = x_user_id or x_admin_id
    _check_admin(user_id)
    try:
        sb = _get_supabase()
        sb.table("admin_settings").upsert(
            {"key": req.key, "value": req.value},
            on_conflict="key"
        ).execute()
        return {"status": "saved", "key": req.key}
    except Exception as e:
        print(f"[admin] save_setting error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ── POST /api/admin/settings/batch ───────────────────────────────────────────
@router.post("/settings/batch")
async def batch_save_settings(
    req: BatchSaveRequest,
    x_user_id: Optional[str] = Header(default=None),
    x_admin_id: Optional[str] = Header(default=None),
):
    """Lagre flere innstillinger på én gang"""
    user_id = x_user_id or x_admin_id
    _check_admin(user_id)
    try:
        sb = _get_supabase()
        rows = [{"key": s.key, "value": s.value} for s in req.settings]
        sb.table("admin_settings").upsert(rows, on_conflict="key").execute()
        return {"status": "saved", "count": len(rows)}
    except Exception as e:
        print(f"[admin] batch_save error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ── GET /api/admin/settings/{key} ────────────────────────────────────────────
@router.get("/settings/{key}")
async def get_setting(
    key: str,
    x_user_id: Optional[str] = Header(default=None),
    x_admin_id: Optional[str] = Header(default=None),
):
    """Hent en innstilling"""
    user_id = x_user_id or x_admin_id
    _check_admin(user_id)
    try:
        sb = _get_supabase()
        result = sb.table("admin_settings").select("value").eq("key", key).execute()
        if result.data:
            return {"key": key, "value": result.data[0]["value"]}
        raise HTTPException(status_code=404, detail=f"Innstilling '{key}' ikke funnet")
    except HTTPException:
        raise
    except Exception as e:
        print(f"[admin] get_setting error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ── GET /api/admin/settings ───────────────────────────────────────────────────
@router.get("/settings")
async def list_settings(
    x_user_id: Optional[str] = Header(default=None),
    x_admin_id: Optional[str] = Header(default=None),
):
    """List alle innstillinger (maskerer sensitive verdier)"""
    user_id = x_user_id or x_admin_id
    _check_admin(user_id)
    try:
        sb = _get_supabase()
        result = sb.table("admin_settings").select("key,value").execute()
        # Masker sensitive verdier
        SENSITIVE = {"secret", "key", "password", "token", "pem"}
        settings = []
        for row in (result.data or []):
            k = row["key"]
            v = row["value"]
            is_sensitive = any(s in k.lower() for s in SENSITIVE)
            settings.append({
                "key": k,
                "value": ("••••••••" + v[-4:]) if is_sensitive and len(v) > 4 else v,
                "has_value": bool(v),
            })
        return {"settings": settings}
    except Exception as e:
        print(f"[admin] list_settings error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
