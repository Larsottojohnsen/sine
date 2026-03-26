"""
Sine Agent Orchestrator
Inspirert av OpenManus sin Manus-agent med ReAct-loop og planlegging.
Bruker Claude som LLM med tool_use.
"""
from __future__ import annotations
import asyncio
import json
import os
import uuid
from pathlib import Path
from typing import AsyncGenerator, Callable, Optional

import anthropic

from schemas.agent import (
    AgentEvent, AgentMode, AgentPlan, AgentRunState, AgentStatus,
    AgentTask, ApprovalRequest, RiskLevel, TaskStatus, ToolResult
)
from tools import (
    GitCloneTool, ListFilesTool, ReadFileTool,
    TerminalTool, WebSearchTool, WriteFileTool
)

WORKSPACES_DIR = Path(os.getenv("WORKSPACES_DIR", "/tmp/sine_workspaces"))

SYSTEM_PROMPT = """Du er Sine, en avansert AI-agent som kan løse komplekse oppgaver ved å bruke verktøy.

Du jobber i en isolert workspace-mappe og kan:
- Kjøre bash-kommandoer og Python-kode via terminal
- Lese og skrive filer
- Søke på internett
- Klone GitHub-repos

## Arbeidsflyt
1. **Planlegg** – Del oppgaven inn i klare, konkrete steg
2. **Utfør** – Bruk verktøy steg for steg, ett om gangen
3. **Verifiser** – Sjekk at hvert steg fungerte før du går videre
4. **Lever** – Oppsummer hva du har gjort og hva som ble laget

## Viktige regler
- Alltid planlegg FØR du starter å kjøre kommandoer
- Bruk norsk i all kommunikasjon med brukeren
- Forklar hva du gjør og hvorfor
- Hvis noe feiler, prøv en alternativ tilnærming
- Aldri anta at en kommando fungerte – verifiser alltid outputen
- Lag filer med meningsfulle navn og god struktur

## Safe Mode
{safe_mode_instructions}

Svar alltid på norsk. Vær presis og handlingsorientert.
"""

SAFE_MODE_ON = """Du kjører i Safe Mode. Dette betyr:
- Ingen destruktive operasjoner (slette filer, formatere disker, etc.)
- Ingen sudo/root-kommandoer
- Ingen nettverksoperasjoner utover websøk
- Spør om bekreftelse ved usikre operasjoner"""

SAFE_MODE_OFF = """Du kjører i Power Mode. Du har utvidede tillatelser, men vær fortsatt forsiktig med destruktive operasjoner."""

MAX_ITERATIONS = 30


class SineOrchestrator:
    """
    Hoved-agent-orkestrator for Sine.
    Implementerer en ReAct-loop (Reason → Act → Observe) med Claude.
    """

    def __init__(self, run_id: str, mode: AgentMode = AgentMode.SAFE):
        self.run_id = run_id
        self.mode = mode
        self.safe_mode = mode == AgentMode.SAFE
        self.workspace = WORKSPACES_DIR / run_id
        self.workspace.mkdir(parents=True, exist_ok=True)

        self.client = anthropic.AsyncAnthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))
        self.model = "claude-opus-4-5"

        # Initialiser verktøy
        self.tools = {
            "terminal": TerminalTool(str(self.workspace), safe_mode=self.safe_mode),
            "read_file": ReadFileTool(str(self.workspace)),
            "write_file": WriteFileTool(str(self.workspace)),
            "list_files": ListFilesTool(str(self.workspace)),
            "web_search": WebSearchTool(),
            "git_clone": GitCloneTool(str(self.workspace)),
        }

        self.state = AgentRunState(run_id=run_id, mode=mode)
        self.messages: list[dict] = []
        self.pending_approval: Optional[asyncio.Event] = None
        self.approval_result: Optional[bool] = None
        self._event_queue: asyncio.Queue = asyncio.Queue()

    def _system_prompt(self) -> str:
        instructions = SAFE_MODE_ON if self.safe_mode else SAFE_MODE_OFF
        return SYSTEM_PROMPT.format(safe_mode_instructions=instructions)

    def _claude_tools(self) -> list[dict]:
        return [t.to_claude_tool() for t in self.tools.values()]

    async def _emit(self, event_type: str, data: dict) -> None:
        event = AgentEvent(type=event_type, data=data)
        await self._event_queue.put(event)

    async def _execute_tool(self, tool_name: str, tool_args: dict) -> ToolResult:
        tool = self.tools.get(tool_name)
        if not tool:
            return ToolResult(
                tool=tool_name, success=False, output="",
                error=f"Ukjent verktøy: {tool_name}"
            )

        # Sjekk om verktøyet krever godkjenning i safe mode
        if self.safe_mode and tool.risk_level == RiskLevel.HIGH:
            await self._emit("approval_needed", {
                "tool": tool_name,
                "args": tool_args,
                "risk_level": "high",
                "description": f"Høy-risiko operasjon: {tool_name}({tool_args})"
            })
            self.state.status = AgentStatus.WAITING_APPROVAL
            self.pending_approval = asyncio.Event()
            await self.pending_approval.wait()

            if not self.approval_result:
                return ToolResult(
                    tool=tool_name, success=False, output="",
                    error="Operasjon avvist av bruker"
                )

        result = await tool.execute(**tool_args)
        return result

    async def run(self, task: str) -> AsyncGenerator[AgentEvent, None]:
        """Kjør agenten og yield events"""
        self.state.status = AgentStatus.PLANNING

        await self._emit("status", {"status": "planning", "message": f"Planlegger: {task}"})

        # Legg til brukermelding
        self.messages.append({"role": "user", "content": task})

        iteration = 0

        while iteration < MAX_ITERATIONS:
            iteration += 1

            # Yield alle events i køen
            while not self._event_queue.empty():
                yield await self._event_queue.get()

            if self.state.status == AgentStatus.STOPPED:
                break

            try:
                # Kall Claude med tool_use
                response = await self.client.messages.create(
                    model=self.model,
                    max_tokens=8096,
                    system=self._system_prompt(),
                    tools=self._claude_tools(),
                    messages=self.messages
                )
            except Exception as e:
                await self._emit("error", {"message": f"LLM-feil: {str(e)}"})
                self.state.status = AgentStatus.FAILED
                break

            # Yield events
            while not self._event_queue.empty():
                yield await self._event_queue.get()

            # Legg til assistant-svar i historikk
            self.messages.append({"role": "assistant", "content": response.content})

            # Sjekk stop reason
            if response.stop_reason == "end_turn":
                # Agenten er ferdig
                final_text = ""
                for block in response.content:
                    if hasattr(block, "text"):
                        final_text = block.text
                        break

                await self._emit("log", {"message": final_text, "level": "info"})
                await self._emit("complete", {
                    "message": final_text,
                    "files": list(self.state.files.keys())
                })
                self.state.status = AgentStatus.COMPLETED
                break

            # Behandle tool_use blokker
            tool_results = []
            has_tool_use = False

            for block in response.content:
                if block.type == "text" and block.text.strip():
                    await self._emit("log", {"message": block.text, "level": "thinking"})

                elif block.type == "tool_use":
                    has_tool_use = True
                    tool_name = block.name
                    tool_args = block.input
                    tool_use_id = block.id

                    await self._emit("tool_call", {
                        "tool": tool_name,
                        "args": tool_args,
                        "id": tool_use_id
                    })

                    # Oppdater status
                    self.state.status = AgentStatus.RUNNING

                    # Kjør verktøyet
                    result = await self._execute_tool(tool_name, tool_args)

                    # Logg filer som ble opprettet/endret
                    for f in result.files_created:
                        self.state.files[f] = "created"
                        await self._emit("file_change", {
                            "path": f,
                            "action": "created"
                        })
                    for f in result.files_modified:
                        self.state.files[f] = "modified"
                        await self._emit("file_change", {
                            "path": f,
                            "action": "modified"
                        })

                    await self._emit("tool_result", {
                        "tool": tool_name,
                        "success": result.success,
                        "output": result.output[:2000],
                        "error": result.error,
                        "id": tool_use_id
                    })

                    tool_results.append({
                        "type": "tool_result",
                        "tool_use_id": tool_use_id,
                        "content": result.output if result.success else f"Feil: {result.error}"
                    })

            # Yield events etter tool-kjøring
            while not self._event_queue.empty():
                yield await self._event_queue.get()

            if not has_tool_use:
                # Ingen verktøy brukt og ikke end_turn – noe er galt
                break

            # Legg til tool-resultater i historikk
            if tool_results:
                self.messages.append({"role": "user", "content": tool_results})

        # Ferdig
        if self.state.status not in (AgentStatus.COMPLETED, AgentStatus.FAILED, AgentStatus.STOPPED):
            self.state.status = AgentStatus.COMPLETED

        # Tøm event-køen
        while not self._event_queue.empty():
            yield await self._event_queue.get()

    def approve(self, approved: bool) -> None:
        """Godkjenn eller avvis en ventende operasjon"""
        self.approval_result = approved
        if self.pending_approval:
            self.pending_approval.set()
            self.state.status = AgentStatus.RUNNING

    def stop(self) -> None:
        """Stopp agenten"""
        self.state.status = AgentStatus.STOPPED
        if self.pending_approval:
            self.approval_result = False
            self.pending_approval.set()
