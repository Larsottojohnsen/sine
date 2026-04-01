"""
Chat API Routes – standard (ikke-agent) modus
POST /api/chat/stream  – SSE streaming chat med Claude
"""
from __future__ import annotations
import os
import json
from typing import AsyncGenerator

import anthropic
from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

router = APIRouter(prefix="/api/chat", tags=["chat"])

client = anthropic.AsyncAnthropic(api_key=os.getenv("ANTHROPIC_API_KEY") or os.getenv("claude_key"))

MODEL_MAP = {
    "sine-1":   "claude-haiku-4-5",
    "sine-pro":  "claude-sonnet-4-5",
}

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


def _build_system(language: str, user_memory: list[dict], active_skills: list = [], connected_apps: list = []) -> str:
    base = SYSTEM_PROMPT_NO if language == "no" else SYSTEM_PROMPT_EN

    # Inject active skill system prompts
    if active_skills:
        skill_sections = []
        for skill in active_skills:
            if skill.system_prompt:
                skill_sections.append(f"### Skill: {skill.name}\n{skill.system_prompt}")
            else:
                skill_sections.append(f"### Skill: {skill.name}\n{skill.description}")
        if skill_sections:
            base += "\n\n## Aktive Skills\nDu har følgende skills aktivert som påvirker hvordan du svarer:\n\n"
            base += "\n\n".join(skill_sections)

    # Inject connected apps context
    if connected_apps:
        apps_str = ", ".join(connected_apps)
        base += f"\n\n## Tilkoblede apper\nBrukeren har koblet til følgende apper: {apps_str}. Du kan referere til disse når det er relevant."

    if user_memory:
        mem_lines = "\n".join(f"- {m.get('key', '')}: {m.get('value', '')}" for m in user_memory)
        base += f"\n\n## Brukerminne\nHusk dette om brukeren:\n{mem_lines}"
    return base


async def _stream_chat(request: ChatRequest) -> AsyncGenerator[str, None]:
    model = MODEL_MAP.get(request.model, "claude-3-5-haiku-20241022")
    system = _build_system(request.language, request.user_memory, request.active_skills, request.connected_apps)
    messages = [{"role": m.role, "content": m.content} for m in request.messages]

    try:
        async with client.messages.stream(
            model=model,
            max_tokens=4096,
            system=system,
            messages=messages,
        ) as stream:
            async for text in stream.text_stream:
                data = json.dumps({"type": "token", "content": text}, ensure_ascii=False)
                yield f"data: {data}\n\n"

            # Send usage stats
            final = await stream.get_final_message()
            usage = {
                "input_tokens": final.usage.input_tokens,
                "output_tokens": final.usage.output_tokens,
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
            model="claude-haiku-4-5",
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
