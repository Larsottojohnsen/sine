"""
Memory API Routes – brukerminne på tvers av samtaler
GET    /api/memory        – hent minne for bruker
POST   /api/memory        – legg til minneoppføring
DELETE /api/memory/{id}   – slett én oppføring
DELETE /api/memory        – slett alt minne
POST   /api/memory/extract – LLM-basert ekstraksjon fra melding
"""
from __future__ import annotations
import json
import os
import uuid
from typing import Optional

import anthropic
from fastapi import APIRouter, Header, HTTPException
from pydantic import BaseModel

router = APIRouter(prefix="/api/memory", tags=["memory"])

# In-memory store (erstattes av Supabase når det er koblet til)
_memory_store: dict[str, list[dict]] = {}

client = anthropic.AsyncAnthropic(api_key=os.getenv("ANTHROPIC_API_KEY") or os.getenv("claude_key"))

EXTRACT_PROMPT = """Analyser denne bruker-meldingen og trekk ut faktainformasjon som er nyttig å huske for fremtidige samtaler.

Eksempler på hva som er verdt å huske:
- Navn, alder, yrke, studiested
- Teknologier og verktøy de bruker
- Pågående prosjekter og mål
- Preferanser (språk, stil, format)
- Kontekst (f.eks. "skriver masteroppgave om X")

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


def _get_user_id(x_user_id: Optional[str]) -> str:
    return x_user_id or "default"


@router.get("")
async def get_memory(x_user_id: Optional[str] = Header(default=None)):
    user_id = _get_user_id(x_user_id)
    return {"memory": _memory_store.get(user_id, [])}


@router.post("")
async def add_memory(
    item: MemoryItem,
    x_user_id: Optional[str] = Header(default=None)
):
    user_id = _get_user_id(x_user_id)
    if user_id not in _memory_store:
        _memory_store[user_id] = []

    entry = {
        "id": str(uuid.uuid4()),
        "key": item.key,
        "value": item.value,
        "source": item.source or "manuelt",
    }
    _memory_store[user_id].append(entry)
    return {"memory": entry}


@router.delete("/{item_id}")
async def delete_memory_item(
    item_id: str,
    x_user_id: Optional[str] = Header(default=None)
):
    user_id = _get_user_id(x_user_id)
    items = _memory_store.get(user_id, [])
    _memory_store[user_id] = [i for i in items if i["id"] != item_id]
    return {"status": "deleted"}


@router.delete("")
async def clear_memory(x_user_id: Optional[str] = Header(default=None)):
    user_id = _get_user_id(x_user_id)
    _memory_store[user_id] = []
    return {"status": "cleared"}


@router.post("/extract")
async def extract_memory(
    req: ExtractRequest,
    x_user_id: Optional[str] = Header(default=None)
):
    """Bruk Claude til å trekke ut minneverdig info fra en melding"""
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
    except Exception:
        return {"extracted": [], "added": 0}

    if not isinstance(extracted, list) or not extracted:
        return {"extracted": [], "added": 0}

    if user_id not in _memory_store:
        _memory_store[user_id] = []

    added = []
    for item in extracted:
        if isinstance(item, dict) and "key" in item and "value" in item:
            entry = {
                "id": str(uuid.uuid4()),
                "key": item["key"],
                "value": item["value"],
                "source": req.source or "auto-ekstraksjon",
            }
            _memory_store[user_id].append(entry)
            added.append(entry)

    return {"extracted": added, "added": len(added)}
