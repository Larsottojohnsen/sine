"""
BrowserTool — Gir Sine-agenten kontroll over en ekte nettleser via browser-use + Claude.

Funksjonalitet:
- Kjører browser-use med Playwright/Chromium
- Streamer skjermbilder og handlinger live til frontend via event-kø
- Bruker BrowserStateSummary.screenshot direkte fra step-callback (ingen ekstra screenshot-kall)
- Støtter "ta over"-modus der brukeren kan overta nettleseren
- Persistent browser-sesjon for raskere oppstart på gjentatte oppgaver
- Returnerer resultatet av nettleseroppgaven som tekst
"""
from __future__ import annotations

import asyncio
import os
import time
from typing import Any, Optional

from schemas.agent import AgentEvent, RiskLevel, ToolResult
from tools.base import BaseTool


class BrowserTool(BaseTool):
    """
    Verktøy som lar agenten styre en nettleser for å utføre web-baserte oppgaver.
    Bruker browser-use med Claude som LLM.
    """

    name = "browser"
    description = (
        "Styr en ekte nettleser for å utføre web-baserte oppgaver. "
        "Bruk dette verktøyet når du trenger å: navigere til nettsider, fylle ut skjemaer, "
        "logge inn på tjenester, skrape data, klikke på knapper, eller gjøre noe som krever "
        "en ekte nettleser. Beskriv oppgaven på norsk."
    )
    risk_level = RiskLevel.MEDIUM

    # Class-level persistent browser session (shared across tasks for speed)
    _shared_browser_session: Any = None
    _shared_browser_lock: asyncio.Lock = asyncio.Lock()

    def __init__(self, event_queue: asyncio.Queue, run_id: str):
        self.event_queue = event_queue
        self.run_id = run_id
        self._takeover_requested = False
        self._takeover_event = asyncio.Event()

    def get_input_schema(self) -> dict:
        return {
            "type": "object",
            "properties": {
                "task": {
                    "type": "string",
                    "description": (
                        "Oppgaven nettleseren skal utføre, beskrevet på norsk. "
                        "Vær spesifikk om URL, handlinger og forventet resultat."
                    ),
                },
                "start_url": {
                    "type": "string",
                    "description": "Valgfri start-URL. Hvis ikke angitt, starter agenten fra en tom side.",
                },
            },
            "required": ["task"],
        }

    async def _emit(self, event_type: str, data: dict) -> None:
        """Send event til frontend via event-køen."""
        await self.event_queue.put(
            AgentEvent(
                type=event_type,
                timestamp=time.time(),
                data=data,
            )
        )

    def request_takeover(self) -> None:
        """Kalt av frontend når brukeren ønsker å ta over nettleseren."""
        self._takeover_requested = True
        self._takeover_event.set()

    def resume_from_takeover(self) -> None:
        """Kalt av frontend når brukeren er ferdig med å ta over."""
        self._takeover_requested = False
        self._takeover_event.clear()

    @classmethod
    async def _get_or_create_browser_session(cls) -> Any:
        """
        Hent eller opprett en persistent browser-sesjon.
        Gjenbruker eksisterende sesjon for raskere oppstart.
        """
        try:
            from browser_use import BrowserSession, BrowserProfile
        except ImportError:
            return None

        async with cls._shared_browser_lock:
            # Sjekk om eksisterende sesjon er gyldig
            if cls._shared_browser_session is not None:
                try:
                    # Test at sesjonen fortsatt fungerer via is_cdp_connected
                    if hasattr(cls._shared_browser_session, 'is_cdp_connected'):
                        if cls._shared_browser_session.is_cdp_connected:
                            return cls._shared_browser_session
                        else:
                            cls._shared_browser_session = None
                    else:
                        return cls._shared_browser_session
                except Exception:
                    cls._shared_browser_session = None

            # Opprett ny sesjon
            try:
                profile = BrowserProfile(
                    headless=True,
                    args=[
                        "--no-sandbox",
                        "--disable-setuid-sandbox",
                        "--disable-dev-shm-usage",
                        "--disable-gpu",
                        "--no-first-run",
                        "--no-zygote",
                        "--single-process",
                        "--disable-extensions",
                    ],
                )
                session = BrowserSession(browser_profile=profile)
                await session.start()
                cls._shared_browser_session = session
                return session
            except Exception:
                return None

    async def execute(self, task: str, start_url: Optional[str] = None, **kwargs) -> ToolResult:
        """
        Kjør browser-use med den gitte oppgaven.
        Streamer skjermbilder og handlinger live til frontend.
        """
        try:
            from browser_use import Agent
            from langchain_anthropic import ChatAnthropic
        except ImportError as e:
            return ToolResult(
                tool=self.name,
                success=False,
                output="",
                error=(
                    f"browser-use er ikke installert: {e}. "
                    "Kjør: pip install browser-use langchain-anthropic"
                ),
            )

        anthropic_key = os.getenv("ANTHROPIC_API_KEY") or os.getenv("claude_key")
        if not anthropic_key:
            return ToolResult(
                tool=self.name,
                success=False,
                output="",
                error="ANTHROPIC_API_KEY er ikke satt. Legg til nøkkelen i miljøvariablene.",
            )

        await self._emit("browser_start", {
            "task": task,
            "message": f"🌐 Starter nettleser for: {task}",
        })

        result_text = ""
        error_text = ""
        browser_session = None
        owns_session = False

        try:
            # Prøv å bruke persistent sesjon for raskere oppstart
            browser_session = await self._get_or_create_browser_session()

            if browser_session is None:
                # Fallback: opprett ny sesjon per oppgave
                try:
                    from browser_use import BrowserSession, BrowserProfile
                    profile = BrowserProfile(
                        headless=True,
                        args=[
                            "--no-sandbox",
                            "--disable-setuid-sandbox",
                            "--disable-dev-shm-usage",
                            "--disable-gpu",
                            "--no-first-run",
                            "--no-zygote",
                            "--single-process",
                            "--disable-extensions",
                        ],
                    )
                    browser_session = BrowserSession(browser_profile=profile)
                    await browser_session.start()
                    owns_session = True
                except Exception:
                    # Siste fallback: bruk gammel Browser API
                    browser_session = None

            # Claude som LLM via LangChain
            llm = ChatAnthropic(
                model="claude-opus-4-5",
                anthropic_api_key=anthropic_key,
                temperature=0,
                max_tokens=4096,
            )

            # ── Step-callback: bruker BrowserStateSummary.screenshot direkte ──
            step_count = [0]
            takeover_self = self  # capture for closure

            async def on_step_end(browser_state: Any, agent_output: Any, step_num: int) -> None:
                """
                Kalles etter hvert steg.
                browser_state: BrowserStateSummary (har .screenshot, .url, .title)
                agent_output:  AgentOutput (har .current_state.thought, .action)
                step_num:      stegnummer (int)
                """
                step_count[0] = step_num

                # Bruk screenshot direkte fra BrowserStateSummary (allerede base64 JPEG)
                screenshot_b64 = getattr(browser_state, 'screenshot', None)
                current_url = getattr(browser_state, 'url', '')
                page_title = getattr(browser_state, 'title', '')

                if screenshot_b64:
                    await takeover_self._emit("browser_screenshot", {
                        "screenshot": screenshot_b64,
                        "url": current_url,
                        "title": page_title,
                        "step": step_num,
                        "message": f"Steg {step_num}: {page_title or current_url}",
                    })

                # Emit agent-tanke og handling
                try:
                    current_state = getattr(agent_output, 'current_state', None)
                    if current_state:
                        thought = getattr(current_state, 'thought', None) or getattr(current_state, 'evaluation_previous_goal', None)
                        if thought:
                            await takeover_self._emit("browser_action", {
                                "step": step_num,
                                "action": str(thought)[:300],
                                "url": current_url,
                                "message": f"💭 {str(thought)[:200]}",
                            })
                except Exception:
                    pass

                # Sjekk om brukeren har bedt om å ta over
                if takeover_self._takeover_requested:
                    await takeover_self._emit("browser_takeover_active", {
                        "message": "⏸️ Agenten er satt på pause. Du har overtatt nettleseren.",
                    })
                    try:
                        await asyncio.wait_for(
                            asyncio.shield(takeover_self._takeover_event.wait()),
                            timeout=600,
                        )
                    except asyncio.TimeoutError:
                        pass
                    takeover_self._takeover_requested = False
                    takeover_self._takeover_event.clear()
                    await takeover_self._emit("browser_takeover_ended", {
                        "message": "▶️ Agenten fortsetter arbeidet.",
                    })

            # ── Bygg og kjør agenten ──
            agent_kwargs: dict[str, Any] = {
                "task": task,
                "llm": llm,
                "max_actions_per_step": 5,
                "use_vision": True,
                "register_new_step_callback": on_step_end,
            }

            # Koble til browser-sesjon
            if browser_session is not None:
                agent_kwargs["browser_session"] = browser_session
            else:
                # Gammel Browser API som fallback
                try:
                    from browser_use import Browser, BrowserConfig
                    browser_config = BrowserConfig(
                        headless=True,
                        disable_security=False,
                        extra_chromium_args=[
                            "--no-sandbox",
                            "--disable-setuid-sandbox",
                            "--disable-dev-shm-usage",
                            "--disable-gpu",
                            "--no-first-run",
                            "--no-zygote",
                            "--single-process",
                            "--disable-extensions",
                        ],
                    )
                    agent_kwargs["browser"] = Browser(config=browser_config)
                except Exception:
                    pass

            # Naviger til start-URL hvis angitt
            if start_url:
                await self._emit("browser_action", {
                    "step": 0,
                    "action": f"Navigerer til {start_url}",
                    "url": start_url,
                    "message": f"🔗 Navigerer til {start_url}",
                })

            agent = Agent(**agent_kwargs)

            # Kjør agenten
            history = await agent.run(max_steps=25)

            # Hent sluttresultat
            if history and hasattr(history, "final_result"):
                result_text = history.final_result() or "Oppgaven er fullført."
            elif history:
                s = str(history)
                result_text = s[-2000:] if len(s) > 2000 else s
            else:
                result_text = "Nettleseroppgaven er fullført."

            await self._emit("browser_done", {
                "message": f"✅ Nettleseroppgave fullført: {result_text[:200]}",
                "result": result_text,
            })

        except Exception as e:
            error_text = str(e)
            await self._emit("browser_error", {
                "message": f"❌ Nettleserfeil: {error_text[:300]}",
                "error": error_text,
            })

            # Sjekk om det er en login-situasjon der brukeren bør ta over
            login_keywords = [
                "login", "logg inn", "sign in", "captcha", "verify",
                "authentication", "password", "passord", "2fa", "otp",
            ]
            if any(kw in error_text.lower() for kw in login_keywords):
                await self._emit("browser_needs_takeover", {
                    "message": "🔐 Agenten trenger hjelp med innlogging. Vil du ta over nettleseren?",
                    "reason": "login_required",
                })

            # Tilbakestill delt sesjon ved feil slik at neste oppgave starter friskt
            async with BrowserTool._shared_browser_lock:
                BrowserTool._shared_browser_session = None

        finally:
            # Lukk kun sesjonen hvis vi eier den (ikke delt)
            if owns_session and browser_session is not None:
                try:
                    await browser_session.stop()
                except Exception:
                    pass

        if error_text and not result_text:
            return ToolResult(
                tool=self.name,
                success=False,
                output="",
                error=error_text,
            )

        return ToolResult(
            tool=self.name,
            success=True,
            output=result_text,
            error=error_text if error_text else None,
        )
