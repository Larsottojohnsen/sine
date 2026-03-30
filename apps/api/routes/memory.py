"""
Memory API Routes – brukerminne på tvers av samtaler (Supabase-persistert)
GET    /api/memory        – hent minne for bruker
POST   /api/memory        – legg til minneoppføring
DELETE /api/memory/{id}   – slett én oppføring
DELETE /api/memory        – slett alt minne
POST   /api/memory/extract – LLM-basert ekstraksjon fra melding
POST   /api/memory/search  – semantisk søk i minne (pgvector)
"""
from __future__ import annotations
import json
import os
import uuid
from typing import Optional

import anthropic
from fastapi import APIRouter, Header, HTTPException
from pydantic import BaseModel
from supabase import create_client, Client

router = APIRouter(prefix="/api/memory", tags=["memory"])

# ── Supabase-klient ──────────────────────────────────────────────────────────
SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")

def _get_supabase() -> Client:
    return create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

# ── Anthropic-klient ─────────────────────────────────────────────────────────
client = anthropic.AsyncAnthropic(
    api_key=os.getenv("ANTHROPIC_API_KEY") or os.getenv("claude_key")
)

EXTRACT_PROMPT = """Analyser denne bruker-meldingen og trekk ut faktainformasjon som er nyttig å huske for fremtidige samtaler.

Eksempler på hva som er verdt å huske:
- Navn, alder, yrke, studiested
- Teknologier og verktøy de bruker
- Pågående prosjekter og mål
- Preferanser (språk, stil, format)
- Kontekst (f.eks. "skriver masteroppgave om X")
- Firma, kunder, produkter de jobber med

Returner kun et JSON-array: [{"key": "...", "value": "..."}]
Returner [] hvis ingenting er verdt å huske.
Svar KUN med JSON, ingen annen tekst.

Melding: {message}"""


class MemoryItem(BaseModel):
    key: str
    value: str
    source: Optional[str] = None


class ExtractRequest(BaseModel):
    message: str
    source: Optional[str] = None
    user_id: Optional[str] = "default"


class SearchRequest(BaseModel):
    query: str
    limit: Optional[int] = 5


def _get_user_id(x_user_id: Optional[str]) -> str:
    return x_user_id or "default"


# ── GET /api/memory ──────────────────────────────────────────────────────────
@router.get("")
async def get_memory(x_user_id: Optional[str] = Header(default=None)):
    user_id = _get_user_id(x_user_id)
    try:
        sb = _get_supabase()
        result = sb.table("user_memory") \
            .select("id, key, value, source, created_at") \
            .eq("user_id", user_id) \
            .order("created_at", desc=False) \
            .execute()
        return {"memory": result.data or []}
    except Exception as e:
        # Fallback: returner tom liste hvis Supabase ikke er tilgjengelig
        print(f"[memory] get_memory error: {e}")
        return {"memory": []}


# ── POST /api/memory ─────────────────────────────────────────────────────────
@router.post("")
async def add_memory(
    item: MemoryItem,
    x_user_id: Optional[str] = Header(default=None)
):
    user_id = _get_user_id(x_user_id)
    try:
        sb = _get_supabase()
        entry = {
            "id": str(uuid.uuid4()),
            "user_id": user_id,
            "key": item.key,
            "value": item.value,
            "source": item.source or "manuelt",
        }
        result = sb.table("user_memory").insert(entry).execute()
        return {"memory": result.data[0] if result.data else entry}
    except Exception as e:
        print(f"[memory] add_memory error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ── DELETE /api/memory/{id} ──────────────────────────────────────────────────
@router.delete("/{item_id}")
async def delete_memory_item(
    item_id: str,
    x_user_id: Optional[str] = Header(default=None)
):
    user_id = _get_user_id(x_user_id)
    try:
        sb = _get_supabase()
        sb.table("user_memory") \
            .delete() \
            .eq("id", item_id) \
            .eq("user_id", user_id) \
            .execute()
        return {"status": "deleted"}
    except Exception as e:
        print(f"[memory] delete_memory_item error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ── DELETE /api/memory ───────────────────────────────────────────────────────
@router.delete("")
async def clear_memory(x_user_id: Optional[str] = Header(default=None)):
    user_id = _get_user_id(x_user_id)
    try:
        sb = _get_supabase()
        sb.table("user_memory") \
            .delete() \
            .eq("user_id", user_id) \
            .execute()
        return {"status": "cleared"}
    except Exception as e:
        print(f"[memory] clear_memory error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ── POST /api/memory/extract ─────────────────────────────────────────────────
@router.post("/extract")
async def extract_memory(
    req: ExtractRequest,
    x_user_id: Optional[str] = Header(default=None)
):
    """Bruk Claude til å trekke ut minneverdig info fra en melding, lagre i Supabase"""
    user_id = _get_user_id(x_user_id) or req.user_id or "default"

    try:
        response = await client.messages.create(
            model="claude-3-5-haiku-20241022",
            max_tokens=512,
            messages=[{
                "role": "user",
                "content": EXTRACT_PROMPT.format(message=req.message)
            }]
        )
        raw = response.content[0].text.strip()
        extracted = json.loads(raw)
    except Exception as e:
        print(f"[memory] extract LLM error: {e}")
        return {"extracted": [], "added": 0}

    if not isinstance(extracted, list) or not extracted:
        return {"extracted": [], "added": 0}

    added = []
    try:
        sb = _get_supabase()
        for item in extracted:
            if isinstance(item, dict) and "key" in item and "value" in item:
                # Sjekk om nøkkelen allerede finnes for denne brukeren
                existing = sb.table("user_memory") \
                    .select("id") \
                    .eq("user_id", user_id) \
                    .eq("key", item["key"]) \
                    .execute()

                if existing.data:
                    # Oppdater eksisterende
                    result = sb.table("user_memory") \
                        .update({"value": item["value"], "source": req.source or "auto-ekstraksjon"}) \
                        .eq("user_id", user_id) \
                        .eq("key", item["key"]) \
                        .execute()
                    if result.data:
                        added.append(result.data[0])
                else:
                    # Legg til ny
                    entry = {
                        "id": str(uuid.uuid4()),
                        "user_id": user_id,
                        "key": item["key"],
                        "value": item["value"],
                        "source": req.source or "auto-ekstraksjon",
                    }
                    result = sb.table("user_memory").insert(entry).execute()
                    if result.data:
                        added.append(result.data[0])
    except Exception as e:
        print(f"[memory] extract save error: {e}")

    return {"extracted": added, "added": len(added)}


# ── POST /api/memory/search ──────────────────────────────────────────────────
@router.post("/search")
async def search_memory(
    req: SearchRequest,
    x_user_id: Optional[str] = Header(default=None)
):
    """Søk i brukerminne med tekst-matching (pgvector-søk legges til i v2)"""
    user_id = _get_user_id(x_user_id)
    try:
        sb = _get_supabase()
        # Enkel ilike-søk for nå — pgvector-embedding legges til i neste fase
        result = sb.table("user_memory") \
            .select("id, key, value, source, created_at") \
            .eq("user_id", user_id) \
            .or_(f"key.ilike.%{req.query}%,value.ilike.%{req.query}%") \
            .limit(req.limit or 5) \
            .execute()
        return {"results": result.data or []}
    except Exception as e:
        print(f"[memory] search_memory error: {e}")
        return {"results": []}
