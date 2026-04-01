"""
Chat API Routes – standard (ikke-agent) modus
POST /api/chat/stream  – SSE streaming chat med Claude

Prompt caching: Systemprompten (inkl. skills og minne) merkes med
cache_control={"type": "ephemeral"} slik at Anthropic cacher den i
5 minutter. Dette reduserer input-token-kostnader med ~80-90% for
lange system-prompter ved gjentatte kall i samme samtale.
"""
from __future__ import annotations
import os
import json
from typing import AsyncGenerator

import anthropic
from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

# ── Kontekstvinduforvaltning ────────────────────────────────────────────────
# Behold alltid de siste N meldingene i full form.
# Eldre meldinger komprimeres til et sammendrag med en billig Haiku-kall.
# Dette reduserer input-token-kostnader med 40-70% for lange samtaler.
MAX_FULL_MESSAGES = 12  # Antall meldinger som beholdes i full form
MIN_MESSAGES_FOR_COMPRESSION = 16  # Ikke komprimer under denne grensen


async def _compress_history(
    client: anthropic.AsyncAnthropic,
    messages: list[dict],
    language: str = "no",
) -> list[dict]:
    """
    Komprimer eldre meldinger til et sammendrag når samtalen blir lang.
    Bruker claude-haiku-4-20 (billigste modell) for komprimeringen.
    Returnerer en ny meldingsliste: [sammendrag-melding] + siste MAX_FULL_MESSAGES meldinger.
    """
    if len(messages) <= MIN_MESSAGES_FOR_COMPRESSION:
        return messages

    # Del opp: eldre meldinger som skal komprimeres, og nyere som beholdes
    old_messages = messages[:-MAX_FULL_MESSAGES]
    recent_messages = messages[-MAX_FULL_MESSAGES:]

    # Bygg tekst av de eldre meldingene for sammendrag
    history_text = ""
    for m in old_messages:
        role_label = "Bruker" if m["role"] == "user" else "Assistent"
        content = m["content"] if isinstance(m["content"], str) else str(m["content"])
        history_text += f"{role_label}: {content[:500]}\n"

    lang_instruction = "norsk" if language == "no" else "English"
    summary_prompt = (
        f"Lag et kort sammendrag på {lang_instruction} av denne samtalehistorikken. "
        f"Behold viktige fakta, beslutninger og kontekst. Maks 200 ord:\n\n{history_text}"
    )

    try:
        response = await client.messages.create(
            model="claude-haiku-4-20",
            max_tokens=300,
            messages=[{"role": "user", "content": summary_prompt}],
        )
        summary_text = response.content[0].text.strip()
        lang_label = "Sammendrag av tidligere samtale" if language == "no" else "Summary of earlier conversation"
        summary_message = {
            "role": "user",
            "content": f"[{lang_label}]:\n{summary_text}"
        }
        # Legg til en tom assistant-melding etter sammendraget for å holde alternering
        ack_message = {
            "role": "assistant",
            "content": "Forstått, jeg husker konteksten fra tidligere i samtalen." if language == "no" else "Understood, I remember the context from earlier in the conversation."
        }
        return [summary_message, ack_message] + recent_messages
    except Exception:
        # Fallback: bare behold de siste meldingene uten komprimering
        return recent_messages

router = APIRouter(prefix="/api/chat", tags=["chat"])

client = anthropic.AsyncAnthropic(api_key=os.getenv("ANTHROPIC_API_KEY") or os.getenv("claude_key"))

MODEL_MAP = {
    "sine-1":   "claude-haiku-4-20",
    "sine-pro":  "claude-sonnet-4-5-20251101",
}

# ── Intelligent modellruting ───────────────────────────────────────────────
# For Sine Pro-brukere: ruter enkle spørsmål til Haiku (billig) og
# komplekse spørsmål til Sonnet (kraftig). Sine 1 bruker alltid Haiku.
#
# Enkle spørsmål: korte meldinger, oversettelse, fakta, enkel formatering
# Komplekse spørsmål: kode, analyse, planlegging, lange meldinger, flerstegs

# Nøkkelord som indikerer komplekse oppgaver
_COMPLEX_KEYWORDS = {
    # Kode og teknisk
    "kod", "kode", "skriv", "lag", "bygg", "implement", "debug", "fiks",
    "funksjon", "klasse", "api", "database", "sql", "python", "javascript",
    "typescript", "react", "html", "css", "json", "xml", "regex",
    "algoritme", "arkitektur", "design", "system",
    # Analyse og planlegging
    "analyser", "sammenlign", "vurder", "forklar", "beskriv", "oppsummer",
    "planlegg", "strategi", "rapport", "dokument", "skriv om",
    # Kreativt
    "skriv en", "lag en", "generer", "oversett", "reformuler",
    # Engelsk
    "write", "create", "build", "implement", "debug", "fix", "analyze",
    "compare", "explain", "summarize", "plan", "generate", "code",
}


def _route_model(base_model: str, last_user_message: str) -> str:
    """
    Velg modell basert på meldingskompleksitet.
    - Sine 1: alltid Haiku (ingen endring)
    - Sine Pro: Haiku for enkle spørsmål, Sonnet for komplekse

    Heuristikk:
    1. Kort melding (< 60 tegn) uten komplekse nøkkelord → Haiku
    2. Lang melding (> 300 tegn) → Sonnet
    3. Inneholder komplekse nøkkelord → Sonnet
    4. Ellers → Haiku
    """
    if base_model != "claude-sonnet-4-5-20251101":
        # Sine 1 eller ukjent modell: ikke ruter
        return base_model

    msg = last_user_message.lower().strip()
    msg_len = len(msg)

    # Alltid Sonnet for lange meldinger
    if msg_len > 300:
        return "claude-sonnet-4-5-20251101"

    # Sjekk for komplekse nøkkelord
    words = set(msg.split())
    # Sjekk både enkeltord og bigrams
    bigrams = {f"{msg.split()[i]} {msg.split()[i+1]}" for i in range(len(msg.split()) - 1)} if len(msg.split()) > 1 else set()
    all_tokens = words | bigrams

    if any(kw in all_tokens or kw in msg for kw in _COMPLEX_KEYWORDS):
        return "claude-sonnet-4-5-20251101"

    # Kort, enkel melding → Haiku (mye billigere)
    return "claude-haiku-4-20"

SYSTEM_PROMPT_NO = """Du er Sine, en intelligent AI-assistent. Du svarer alltid på norsk med mindre brukeren skriver på et annet språk.
Vær presis, hjelpsom og vennlig. Bruk markdown for formatering der det er naturlig."""

SYSTEM_PROMPT_EN = """You are Sine, an intelligent AI assistant. Respond in English.
Be precise, helpful and friendly. Use markdown formatting where appropriate."""


class ChatMessage(BaseModel):
    role: str   # "user" | "assistant"
    content: str


class SkillData(BaseModel):
    name: str
    description: str
    system_prompt: str | None = None


class ChatRequest(BaseModel):
    messages: list[ChatMessage]
    model: str = "sine-1"
    language: str = "no"
    user_memory: list[dict] = []
    conversation_id: str | None = None
    active_skills: list[SkillData] = []
    connected_apps: list[str] = []
    planning_mode: bool = False


def _build_system_blocks(
    language: str,
    user_memory: list[dict],
    active_skills: list = [],
    connected_apps: list = [],
    planning_mode: bool = False,
) -> list[dict]:
    """
    Bygger system-prompt som en liste av blokker med prompt caching.
    Den statiske basepromptblokken caches alltid (ephemeral).
    Dynamiske deler (minne, skills) legges til som separate blokker
    der den siste blokken caches for å dekke hele systemkonteksten.
    """
    base = SYSTEM_PROMPT_NO if language == "no" else SYSTEM_PROMPT_EN

    # Legg til planleggingsmodus-instruksjoner
    if planning_mode:
        base += (
            "\n\n## Planleggingsmodus\n"
            "Du er nå i planleggingsmodus. Før du utfører noe, skal du:\n"
            "1. Lage en detaljert, nummerert plan over hva du vil gjøre\n"
            "2. Presentere planen for brukeren\n"
            "3. Vente på bekreftelse før du fortsetter\n"
            "Bruk formatet:\n"
            "**Plan:**\n"
            "1. [steg 1]\n"
            "2. [steg 2]\n"
            "...\n"
            "Er du klar til å starte? (ja/nei)"
        )

    # Bygg dynamisk del (skills, apper, minne)
    dynamic_parts = []

    if active_skills:
        skill_sections = []
        for skill in active_skills:
            if skill.system_prompt:
                skill_sections.append(f"### Skill: {skill.name}\n{skill.system_prompt}")
            else:
                skill_sections.append(f"### Skill: {skill.name}\n{skill.description}")
        if skill_sections:
            dynamic_parts.append(
                "## Aktive Skills\nDu har følgende skills aktivert som påvirker hvordan du svarer:\n\n"
                + "\n\n".join(skill_sections)
            )

    if connected_apps:
        apps_str = ", ".join(connected_apps)
        dynamic_parts.append(
            f"## Tilkoblede apper\nBrukeren har koblet til følgende apper: {apps_str}. "
            "Du kan referere til disse når det er relevant."
        )

    if user_memory:
        mem_lines = "\n".join(f"- {m.get('key', '')}: {m.get('value', '')}" for m in user_memory)
        dynamic_parts.append(f"## Brukerminne\nHusk dette om brukeren:\n{mem_lines}")

    # Sett sammen alle deler
    full_system = base
    if dynamic_parts:
        full_system += "\n\n" + "\n\n".join(dynamic_parts)

    # Returner som én cacheable blokk
    # Anthropic cacher blokker merket med cache_control i 5 minutter.
    # Dette sparer ~80-90% av input-token-kostnader for gjentatte kall.
    return [
        {
            "type": "text",
            "text": full_system,
            "cache_control": {"type": "ephemeral"},
        }
    ]


async def _stream_chat(request: ChatRequest) -> AsyncGenerator[str, None]:
    # Basismodell fra brukerens plan (sine-1 → haiku, sine-pro → sonnet)
    base_model = MODEL_MAP.get(request.model, "claude-haiku-4-20")

    # Bygg meldingsliste og anvend kontekstvinduforvaltning
    messages = [{"role": m.role, "content": m.content} for m in request.messages]
    messages = await _compress_history(client, messages, request.language)

    # Intelligent modellruting: velg billigere modell for enkle spørsmål
    last_user_msg = next(
        (m["content"] for m in reversed(messages) if m["role"] == "user"),
        ""
    )
    model = _route_model(base_model, last_user_msg)

    system_blocks = _build_system_blocks(
        request.language,
        request.user_memory,
        request.active_skills,
        request.connected_apps,
        request.planning_mode,
    )

    try:
        async with client.messages.stream(
            model=model,
            max_tokens=4096,
            system=system_blocks,
            messages=messages,
            # Aktiver prompt caching (beta-header kreves for noen modeller)
            extra_headers={"anthropic-beta": "prompt-caching-2024-07-31"},
        ) as stream:
            async for text in stream.text_stream:
                data = json.dumps({"type": "token", "content": text}, ensure_ascii=False)
                yield f"data: {data}\n\n"

            # Send usage stats inkl. cache-info
            final = await stream.get_final_message()
            usage = {
                "input_tokens": final.usage.input_tokens,
                "output_tokens": final.usage.output_tokens,
                "cache_creation_input_tokens": getattr(final.usage, "cache_creation_input_tokens", 0),
                "cache_read_input_tokens": getattr(final.usage, "cache_read_input_tokens", 0),
            }
            yield f"data: {json.dumps({'type': 'done', 'usage': usage})}\n\n"

    except anthropic.APIStatusError as e:
        err = json.dumps({"type": "error", "message": str(e)})
        yield f"data: {err}\n\n"
    except Exception as e:
        err = json.dumps({"type": "error", "message": f"Intern feil: {str(e)}"})
        yield f"data: {err}\n\n"


@router.post("/stream")
async def chat_stream(request: ChatRequest):
    """SSE streaming chat-endepunkt"""
    return StreamingResponse(
        _stream_chat(request),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
            "Connection": "keep-alive",
        },
    )


class TitleRequest(BaseModel):
    message: str
    language: str = "no"

@router.post("/generate-title")
async def generate_title(request: TitleRequest):
    """Generate a short, descriptive conversation title from the first user message."""
    try:
        lang_hint = "Norwegian" if request.language == "no" else "English"
        prompt = (
            f"Generate a short, descriptive title for a conversation that starts with this message. "
            f"The title should be in {lang_hint}, 3-6 words, no quotes, no punctuation at the end. "
            f"Capture the essence of what the user wants. Do not use generic titles like 'New conversation'. "
            f"Message: {request.message[:500]}"
        )
        response = await client.messages.create(
            model="claude-haiku-4-20",
            max_tokens=30,
            messages=[{"role": "user", "content": prompt}],
        )
        title = response.content[0].text.strip().strip('"').strip("'")
        return {"title": title}
    except Exception as e:
        # Fallback: truncate the message
        words = request.message.split()
        fallback = " ".join(words[:6])
        if len(words) > 6:
            fallback += "…"
        return {"title": fallback}
