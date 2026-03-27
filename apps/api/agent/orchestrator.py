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
import zipfile
import base64
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
4. **Pakk og lever** – Pakk ALLTID alle leveransefiler i en ZIP-fil for enkel nedlasting
5. **Oppsummer** – Skriv en klar oppsummering på norsk av hva som ble laget

## Viktige regler
- Alltid planlegg FØR du starter å kjøre kommandoer
- Bruk norsk i all kommunikasjon med brukeren
- Forklar hva du gjør og hvorfor med korte setninger
- **ALDRI gi opp** – hvis noe feiler, prøv alltid en alternativ tilnærming
- Hvis et verktøy feiler, tenk på andre måter å oppnå samme resultat
- Eksempler på alternativer: bruk curl i stedet for git clone, skriv filen manuelt i stedet for å laste ned, bruk en annen pakkeversjon, etc.
- Aldri anta at en kommando fungerte – verifiser alltid outputen
- Lag filer med meningsfulle navn og god struktur
- **ALLTID pakk leveransen som ZIP** – bruk terminal: zip -r leveranse.zip <mappe>/
- Skriv alltid en README.md med installasjonsinstruksjoner
- Bare spør brukeren om hjelp hvis du absolutt ikke finner noen løsning etter mange forsøk

## Leveranse-format
Når du er ferdig, skriv en oppsummering som:
- Forklarer hva som ble laget
- Beskriver hvordan det brukes
- Lister opp nøkkelfiler

Avslutt alltid med 3 konkrete forslag til videre arbeid basert på DENNE SPESIFIKKE OPPGAVEN.
Format forslagene slik (på slutten av svaret ditt):
FORSLAG:
1. <forslag basert på oppgaven>
2. <forslag basert på oppgaven>
3. <forslag basert på oppgaven>

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
MAX_LLM_RETRIES = 3
MAX_TOOL_FAILURES = 5  # Maks antall verktøy-feil før agenten spør brukeren


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

        self.client = anthropic.AsyncAnthropic(api_key=os.getenv("ANTHROPIC_API_KEY") or os.getenv("claude_key"))
        self.model = "claude-sonnet-4-5"

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

    def _collect_delivery_files(self) -> list[dict]:
        """Samle alle filer i workspace for leveranse"""
        files = []
        if not self.workspace.exists():
            return files

        # Prioriter ZIP-filer
        zip_files = list(self.workspace.rglob("*.zip"))
        other_files = [f for f in self.workspace.rglob("*") if f.is_file() and f.suffix != '.zip']

        all_files = zip_files + other_files

        for f in all_files[:10]:  # Maks 10 filer
            try:
                rel = str(f.relative_to(self.workspace))
                size = f.stat().st_size
                size_str = f"{size // 1024}KB" if size > 1024 else f"{size}B"

                # Les innhold for tekstfiler (maks 50KB)
                content = None
                ext = f.suffix.lower()
                text_exts = {'.js', '.ts', '.tsx', '.jsx', '.py', '.html', '.css',
                             '.json', '.md', '.txt', '.yaml', '.yml', '.sh', '.bash',
                             '.rs', '.go', '.java', '.rb', '.php', '.xml', '.csv'}
                if ext in text_exts and size < 50 * 1024:
                    try:
                        content = f.read_text(encoding='utf-8', errors='replace')
                    except Exception:
                        content = None

                # Bestem type
                if ext == '.zip':
                    ftype = 'archive'
                elif ext in {'.md', '.mdx'}:
                    ftype = 'markdown'
                elif ext in {'.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp'}:
                    ftype = 'image'
                elif ext in text_exts:
                    ftype = 'code'
                else:
                    ftype = 'other'

                files.append({
                    "name": f.name,
                    "path": rel,
                    "type": ftype,
                    "size": size_str,
                    "content": content,
                })
            except Exception:
                continue

        return files

    def _parse_suggestions(self, text: str) -> tuple[str, list[str]]:
        """Trekk ut FORSLAG-seksjonen fra agent-svaret"""
        suggestions = []
        clean_text = text

        if "FORSLAG:" in text:
            parts = text.split("FORSLAG:", 1)
            clean_text = parts[0].strip()
            suggestion_block = parts[1].strip()
            for line in suggestion_block.split('\n'):
                line = line.strip()
                if line and line[0].isdigit() and '. ' in line:
                    suggestion = line.split('. ', 1)[1].strip()
                    if suggestion:
                        suggestions.append(suggestion)

        return clean_text, suggestions[:3]

    async def run(self, task: str) -> AsyncGenerator[AgentEvent, None]:
        """Kjør agenten og yield events"""
        self.state.status = AgentStatus.PLANNING

        await self._emit("status", {"status": "planning", "message": f"Planlegger: {task}"})

        # Legg til brukermelding
        self.messages.append({"role": "user", "content": task})

        iteration = 0
        llm_retries = 0
        consecutive_tool_failures = 0

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
                llm_retries = 0  # Reset ved suksess
            except Exception as e:
                llm_retries += 1
                await self._emit("log", {"message": f"LLM-feil (forsøk {llm_retries}/{MAX_LLM_RETRIES}): {str(e)}", "level": "error"})
                if llm_retries >= MAX_LLM_RETRIES:
                    await self._emit("error", {"message": f"Kunne ikke nå AI-modellen etter {MAX_LLM_RETRIES} forsøk: {str(e)}"})
                    self.state.status = AgentStatus.FAILED
                    break
                # Vent litt før retry
                await asyncio.sleep(2 * llm_retries)
                continue

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

                # Parse ut forslag fra svaret
                clean_text, suggestions = self._parse_suggestions(final_text)

                # Samle leveransefiler
                delivery_files = self._collect_delivery_files()

                await self._emit("log", {"message": clean_text, "level": "info"})
                await self._emit("complete", {
                    "message": clean_text,
                    "files": delivery_files,
                    "suggestions": suggestions,
                    "file_paths": list(self.state.files.keys())
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

                    if not result.success:
                        consecutive_tool_failures += 1
                        # Legg til en eksplisitt instruksjon om å prøve alternativ tilnærming
                        error_hint = (
                            f"Feil: {result.error}. "
                            f"Prøv en alternativ tilnærming for å løse dette. "
                            f"Ikke gi opp – finn en annen måte."
                        )
                        tool_results.append({
                            "type": "tool_result",
                            "tool_use_id": tool_use_id,
                            "content": error_hint
                        })
                        # Spør brukeren hvis for mange feil på rad
                        if consecutive_tool_failures >= MAX_TOOL_FAILURES:
                            await self._emit("ask_user", {
                                "message": (
                                    f"Jeg har prøvd {consecutive_tool_failures} ganger uten suksess. "
                                    f"Siste feil: {result.error}. "
                                    f"Kan du gi meg mer informasjon eller en annen tilnærming?"
                                )
                            })
                            consecutive_tool_failures = 0  # Reset etter spørsmål
                    else:
                        consecutive_tool_failures = 0  # Reset ved suksess
                        tool_results.append({
                            "type": "tool_result",
                            "tool_use_id": tool_use_id,
                            "content": result.output
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
