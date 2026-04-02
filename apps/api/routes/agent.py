"""
Agent API Routes
- POST /api/agent/start – start ny agent-kjøring
- WS  /api/agent/ws/{run_id} – WebSocket for real-time events
- POST /api/agent/{run_id}/approve – godkjenn ventende operasjon
- POST /api/agent/{run_id}/stop – stopp agenten
- GET  /api/agent/{run_id}/files/{path} – hent filinnhold
"""
from __future__ import annotations
import asyncio
import json
import uuid
from typing import Optional

from fastapi import APIRouter, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.responses import JSONResponse, FileResponse

from agent.orchestrator import SineOrchestrator
from schemas.agent import AgentMode, ApprovalResponse, StartAgentRequest

router = APIRouter(prefix="/api/agent", tags=["agent"])

# Aktive agent-kjøringer: run_id -> SineOrchestrator
active_runs: dict[str, SineOrchestrator] = {}


@router.post("/start")
async def start_agent(request: StartAgentRequest):
    """Start en ny agent-kjøring og returner run_id"""
    run_id = request.session_id or str(uuid.uuid4())

    orchestrator = SineOrchestrator(run_id=run_id, mode=request.mode)
    active_runs[run_id] = orchestrator

    return {"run_id": run_id, "status": "started"}


@router.websocket("/ws/{run_id}")
async def agent_websocket(websocket: WebSocket, run_id: str):
    """WebSocket for real-time agent-events"""
    await websocket.accept()

    orchestrator = active_runs.get(run_id)
    if not orchestrator:
        await websocket.send_json({"type": "error", "data": {"message": f"Ingen aktiv kjøring: {run_id}"}})
        await websocket.close()
        return

    # Hent oppgaven fra WebSocket-meldingen
    try:
        init_data = await asyncio.wait_for(websocket.receive_json(), timeout=10.0)
        task = init_data.get("task", "")
        user_memory = init_data.get("user_memory", [])  # Brukerminne fra frontend
        conversation_history = init_data.get("conversation_history", [])  # Samtalehistorikk på tvers av modi
    except asyncio.TimeoutError:
        await websocket.send_json({"type": "error", "data": {"message": "Tidsavbrutt – ingen oppgave mottatt"}})
        await websocket.close()
        return

    if not task:
        await websocket.send_json({"type": "error", "data": {"message": "Ingen oppgave angitt"}})
        await websocket.close()
        return

    # Kjør agenten og stream events
    try:
        async for event in orchestrator.run(task, user_memory=user_memory, conversation_history=conversation_history):
            try:
                await websocket.send_json({
                    "type": event.type,
                    "timestamp": event.timestamp,
                    "data": event.data
                })
            except Exception:
                break

            # Sjekk om klienten har sendt noe (f.eks. stop)
            try:
                msg = await asyncio.wait_for(websocket.receive_json(), timeout=0.01)
                if msg.get("action") == "stop":
                    orchestrator.stop()
            except (asyncio.TimeoutError, Exception):
                pass

    except WebSocketDisconnect:
        orchestrator.stop()
    except Exception as e:
        try:
            await websocket.send_json({"type": "error", "data": {"message": str(e)}})
        except Exception:
            pass
    finally:
        # Rydd opp etter 30 minutter (gir tid til fil-preview og nedlasting)
        asyncio.create_task(_cleanup_run(run_id, delay=1800))

    try:
        await websocket.close()
    except Exception:
        pass


@router.post("/{run_id}/approve")
async def approve_action(run_id: str, response: ApprovalResponse):
    """Godkjenn eller avvis en ventende agent-operasjon"""
    orchestrator = active_runs.get(run_id)
    if not orchestrator:
        raise HTTPException(status_code=404, detail="Kjøring ikke funnet")

    orchestrator.approve(response.approved)
    return {"status": "ok", "approved": response.approved}


@router.post("/{run_id}/stop")
async def stop_agent(run_id: str):
    """Stopp en aktiv agent-kjøring"""
    orchestrator = active_runs.get(run_id)
    if not orchestrator:
        raise HTTPException(status_code=404, detail="Kjøring ikke funnet")

    orchestrator.stop()
    return {"status": "stopped"}


@router.get("/{run_id}/files")
async def list_files(run_id: str):
    """List alle filer i agent-workspace"""
    orchestrator = active_runs.get(run_id)
    if not orchestrator:
        raise HTTPException(status_code=404, detail="Kjøring ikke funnet")

    files = []
    workspace = orchestrator.workspace
    if workspace.exists():
        for f in sorted(workspace.rglob("*")):
            if f.is_file():
                rel = str(f.relative_to(workspace))
                files.append({
                    "path": rel,
                    "size": f.stat().st_size,
                    "action": orchestrator.state.files.get(rel, "existing")
                })

    return {"files": files}


@router.get("/{run_id}/files/{file_path:path}")
async def get_file(run_id: str, file_path: str):
    """Hent innholdet i en spesifikk fil"""
    orchestrator = active_runs.get(run_id)
    if not orchestrator:
        raise HTTPException(status_code=404, detail="Kjøring ikke funnet")

    full_path = orchestrator.workspace / file_path
    if not full_path.exists() or not full_path.is_file():
        raise HTTPException(status_code=404, detail="Fil ikke funnet")

    try:
        content = full_path.read_text(encoding="utf-8", errors="replace")
        return {"path": file_path, "content": content}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{run_id}/download/{file_path:path}")
async def download_file(run_id: str, file_path: str):
    """Last ned en fil fra agent-workspace"""
    orchestrator = active_runs.get(run_id)
    if not orchestrator:
        raise HTTPException(status_code=404, detail="Kjøring ikke funnet")

    full_path = orchestrator.workspace / file_path
    if not full_path.exists() or not full_path.is_file():
        raise HTTPException(status_code=404, detail="Fil ikke funnet")

    return FileResponse(
        path=str(full_path),
        filename=full_path.name,
        media_type="application/octet-stream"
    )


async def _cleanup_run(run_id: str, delay: int = 300):
    """Rydd opp en kjøring etter forsinkelse (inkl. E2B sandkasse)"""
    await asyncio.sleep(delay)
    orchestrator = active_runs.pop(run_id, None)
    if orchestrator:
        try:
            await orchestrator.cleanup()
        except Exception:
            pass


@router.post("/{run_id}/browser/takeover")
async def browser_takeover(run_id: str):
    """Be agenten om å pause så brukeren kan ta over nettleseren"""
    orchestrator = active_runs.get(run_id)
    if not orchestrator:
        raise HTTPException(status_code=404, detail="Kjøring ikke funnet")
    if hasattr(orchestrator, 'browser_tool') and orchestrator.browser_tool:
        orchestrator.browser_tool.request_takeover()
    return {"status": "takeover_requested"}


@router.post("/{run_id}/browser/resume")
async def browser_resume(run_id: str):
    """Fortsett agent-kjøring etter at brukeren er ferdig med å ta over"""
    orchestrator = active_runs.get(run_id)
    if not orchestrator:
        raise HTTPException(status_code=404, detail="Kjøring ikke funnet")
    if hasattr(orchestrator, 'browser_tool') and orchestrator.browser_tool:
        orchestrator.browser_tool.resume_from_takeover()
    return {"status": "resumed"}


@router.get("/status")
async def agent_status():
    """Returner status for agent-systemet inkl. E2B-tilgjengelighet"""
    import os
    e2b_available = bool(os.getenv("E2B_API_KEY") or os.getenv("e2b_adc2a4765b2c0b1e4e7c291a5de3910160041901"))
    return {
        "active_runs": len(active_runs),
        "e2b_enabled": e2b_available,
        "sandbox_type": "e2b_cloud" if e2b_available else "local"
    }
