"""
Sine API – FastAPI backend
"""
from __future__ import annotations
import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

load_dotenv()

from routes.agent import router as agent_router
from routes.chat import router as chat_router
from routes.memory import router as memory_router
from routes.conversations import router as conversations_router
from routes.library import router as library_router
from routes.gmail import router as gmail_router

app = FastAPI(
    title="Sine API",
    description="Backend for Sine AI-plattformen",
    version="1.0.0"
)

# CORS – tillat GitHub Pages og lokal utvikling
ALLOWED_ORIGINS = [
    "https://sine.no",
    "https://www.sine.no",
    "https://larsottojohnsen.github.io",
    "http://localhost:5173",
    "http://localhost:3000",
    os.getenv("FRONTEND_URL", ""),
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=[o for o in ALLOWED_ORIGINS if o],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(agent_router)
app.include_router(chat_router)
app.include_router(memory_router)
app.include_router(conversations_router)
app.include_router(library_router)
app.include_router(gmail_router)


@app.get("/health")
async def health():
    return {"status": "ok", "service": "sine-api"}


@app.get("/")
async def root():
    return {"message": "Sine API v1.0", "docs": "/docs"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=int(os.getenv("PORT", 8000)),
        reload=os.getenv("ENV", "production") == "development"
    )
