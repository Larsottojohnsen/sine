"""
Memory API Routes – brukerminne på tvers av samtaler (Supabase-persistert)
GET    /api/memory           – hent minne for bruker
POST   /api/memory           – legg til minneoppføring
DELETE /api/memory/{id}      – slett én oppføring
DELETE /api/memory           – slett alt minne
POST   /api/memory/extract   – LLM-basert ekstraksjon fra melding
POST   /api/memory/search    – tekst-matching søk i minne
POST   /api/memory/relevant  – LLM-basert utvalg av relevante minner (Claude Code-inspirert)
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

# ── Prompt for LLM-basert minneutvalg (inspirert av Claude Code) ─────────────
RELEVANT_MEMORY_PROMPT = """Du er en minneassistent for Sine AI. Brukeren har lagret følgende minner:

{memory_list}

Brukerens nåværende melding er:
"{query}"

Velg de {max_count} mest relevante minnene for denne meldingen. Et minne er relevant hvis det:
- Gir nyttig kontekst for å svare på meldingen
- Inneholder informasjon om brukeren som påvirker svaret
- Er direkte relatert til emnet i meldingen

Returner KUN et JSON-array med ID-ene til de valgte minnene, sortert etter relevans (mest relevant først):
["id1", "id2", ...]

Returner [] hvis ingen minner er relevante.
Svar KUN med JSON, ingen annen tekst."""


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


class RelevantMemoryRequest(BaseModel):
    """
    LLM-basert minnehenting inspirert av Claude Code sin findRelevantMemories.
    Bruker Claude til å velge de mest relevante minnene for en gitt spørring,
    i stedet for å injisere alle minner i system-prompten.
    """
    query: str
    max_count: Optional[int] = 5


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
            model="claude-haiku-4-20",
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


# ── POST /api/memory/relevant ────────────────────────────────────────────────
@router.post("/relevant")
async def get_relevant_memories(
    req: RelevantMemoryRequest,
    x_user_id: Optional[str] = Header(default=None)
):
    """
    LLM-basert minnehenting inspirert av Claude Code sin findRelevantMemories.

    I stedet for å injisere ALLE minner i system-prompten, bruker denne
    endepunktet Claude til å velge de N mest relevante minnene for en
    gitt brukermelding. Dette:
    - Reduserer token-forbruk ved mange lagrede minner
    - Øker presisjon (irrelevante minner støyer ikke)
    - Gir raskere responstid

    Fallback: hvis LLM-kallet feiler, returneres de siste N minnene.
    """
    user_id = _get_user_id(x_user_id)
    max_count = min(req.max_count or 5, 10)  # Maks 10 minner

    try:
        sb = _get_supabase()
        all_memories_result = sb.table("user_memory") \
            .select("id, key, value, source, created_at") \
            .eq("user_id", user_id) \
            .order("created_at", desc=False) \
            .execute()
        all_memories = all_memories_result.data or []
    except Exception as e:
        print(f"[memory] relevant get_all error: {e}")
        return {"memories": [], "method": "error"}

    # Ingen minner lagret
    if not all_memories:
        return {"memories": [], "method": "empty"}

    # Få minner: returner alle direkte uten LLM-kall
    if len(all_memories) <= max_count:
        return {"memories": all_memories, "method": "all"}

    # Bygg minneliste for LLM
    memory_list_lines = []
    for m in all_memories:
        memory_list_lines.append(f'- ID: {m["id"]} | {m["key"]}: {m["value"]}')
    memory_list_str = "\n".join(memory_list_lines)

    try:
        response = await client.messages.create(
            model="claude-haiku-4-20",
            max_tokens=256,
            messages=[{
                "role": "user",
                "content": RELEVANT_MEMORY_PROMPT.format(
                    memory_list=memory_list_str,
                    query=req.query[:500],
                    max_count=max_count,
                )
            }]
        )
        raw = response.content[0].text.strip()
        selected_ids: list[str] = json.loads(raw)

        if not isinstance(selected_ids, list):
            raise ValueError("LLM returnerte ikke en liste")

        # Bygg opp resultat i riktig rekkefølge (mest relevant først)
        id_to_memory = {m["id"]: m for m in all_memories}
        relevant = [id_to_memory[mid] for mid in selected_ids if mid in id_to_memory]

        print(f"[memory] relevant: LLM valgte {len(relevant)}/{len(all_memories)} minner for query: {req.query[:50]}")
        return {"memories": relevant, "method": "llm", "total": len(all_memories)}

    except Exception as e:
        print(f"[memory] relevant LLM error: {e} — fallback til siste {max_count} minner")
        # Fallback: returner de siste N minnene
        return {
            "memories": all_memories[-max_count:],
            "method": "fallback",
            "total": len(all_memories),
        }
