"""
Conversations API Routes – samtalehistorikk
GET    /api/conversations           – hent alle samtaler
POST   /api/conversations           – opprett ny samtale
GET    /api/conversations/{id}      – hent én samtale med meldinger
PUT    /api/conversations/{id}      – oppdater tittel
DELETE /api/conversations/{id}      – slett samtale
POST   /api/conversations/{id}/messages – legg til melding
"""
from __future__ import annotations
import uuid
import time
from typing import Optional

from fastapi import APIRouter, Header, HTTPException
from pydantic import BaseModel

router = APIRouter(prefix="/api/conversations", tags=["conversations"])

# In-memory store (erstattes av Supabase)
_conversations: dict[str, dict] = {}


class CreateConversationRequest(BaseModel):
    title: str = "Ny samtale"
    mode: str = "chat"  # "chat" | "agent"


class UpdateConversationRequest(BaseModel):
    title: str


class AddMessageRequest(BaseModel):
    role: str  # "user" | "assistant"
    content: str
    metadata: dict = {}


def _get_user_id(x_user_id: Optional[str]) -> str:
    return x_user_id or "default"


@router.get("")
async def list_conversations(x_user_id: Optional[str] = Header(default=None)):
    user_id = _get_user_id(x_user_id)
    convs = [
        {k: v for k, v in c.items() if k != "messages"}
        for c in _conversations.values()
        if c["user_id"] == user_id
    ]
    convs.sort(key=lambda c: c["updated_at"], reverse=True)
    return {"conversations": convs}


@router.post("")
async def create_conversation(
    req: CreateConversationRequest,
    x_user_id: Optional[str] = Header(default=None)
):
    user_id = _get_user_id(x_user_id)
    conv_id = str(uuid.uuid4())
    now = time.time()
    conv = {
        "id": conv_id,
        "user_id": user_id,
        "title": req.title,
        "mode": req.mode,
        "messages": [],
        "created_at": now,
        "updated_at": now,
    }
    _conversations[conv_id] = conv
    return {"conversation": {k: v for k, v in conv.items() if k != "messages"}}


@router.get("/{conv_id}")
async def get_conversation(
    conv_id: str,
    x_user_id: Optional[str] = Header(default=None)
):
    user_id = _get_user_id(x_user_id)
    conv = _conversations.get(conv_id)
    if not conv or conv["user_id"] != user_id:
        raise HTTPException(status_code=404, detail="Samtale ikke funnet")
    return {"conversation": conv}


@router.put("/{conv_id}")
async def update_conversation(
    conv_id: str,
    req: UpdateConversationRequest,
    x_user_id: Optional[str] = Header(default=None)
):
    user_id = _get_user_id(x_user_id)
    conv = _conversations.get(conv_id)
    if not conv or conv["user_id"] != user_id:
        raise HTTPException(status_code=404, detail="Samtale ikke funnet")
    conv["title"] = req.title
    conv["updated_at"] = time.time()
    return {"conversation": {k: v for k, v in conv.items() if k != "messages"}}


@router.delete("/{conv_id}")
async def delete_conversation(
    conv_id: str,
    x_user_id: Optional[str] = Header(default=None)
):
    user_id = _get_user_id(x_user_id)
    conv = _conversations.get(conv_id)
    if not conv or conv["user_id"] != user_id:
        raise HTTPException(status_code=404, detail="Samtale ikke funnet")
    del _conversations[conv_id]
    return {"status": "deleted"}


@router.post("/{conv_id}/messages")
async def add_message(
    conv_id: str,
    req: AddMessageRequest,
    x_user_id: Optional[str] = Header(default=None)
):
    user_id = _get_user_id(x_user_id)
    conv = _conversations.get(conv_id)
    if not conv or conv["user_id"] != user_id:
        raise HTTPException(status_code=404, detail="Samtale ikke funnet")

    msg = {
        "id": str(uuid.uuid4()),
        "role": req.role,
        "content": req.content,
        "metadata": req.metadata,
        "created_at": time.time(),
    }
    conv["messages"].append(msg)
    conv["updated_at"] = time.time()

    # Auto-tittel fra første brukermelding
    if req.role == "user" and conv["title"] == "Ny samtale":
        words = req.content.split()[:6]
        conv["title"] = " ".join(words) + ("..." if len(req.content.split()) > 6 else "")

    return {"message": msg}
