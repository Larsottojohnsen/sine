"""
BrowserTool — Gir Sine-agenten kontroll over en ekte nettleser via browser-use + Claude.

Funksjonalitet:
- Kjører browser-use med Playwright/Chromium
- Streamer skjermbilder og handlinger live til frontend via event-kø
- Støtter "ta over"-modus der brukeren kan overta nettleseren
- Returnerer resultatet av nettleseroppgaven som tekst
"""
from __future__ import annotations

import asyncio
import base64
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

    def __init__(self, event_queue: asyncio.Queue, run_id: str):
        self.event_queue = event_queue
        self.run_id = run_id
        self._takeover_requested = False
        self._takeover_event = asyncio.Event()
        self._browser_instance = None

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

    async def _take_screenshot_base64(self, page: Any) -> Optional[str]:
        """Ta skjermbilde og returner som base64-streng."""
        try:
            screenshot_bytes = await page.screenshot(
                type="jpeg",
                quality=65,
                full_page=False,
            )
            return base64.b64encode(screenshot_bytes).decode("utf-8")
        except Exception:
            return None

    def request_takeover(self) -> None:
        """Kalt av frontend når brukeren ønsker å ta over nettleseren."""
        self._takeover_requested = True
        self._takeover_event.set()

    def resume_from_takeover(self) -> None:
        """Kalt av frontend når brukeren er ferdig med å ta over."""
        self._takeover_requested = False
        self._takeover_event.clear()

    async def execute(self, task: str, start_url: Optional[str] = None, **kwargs) -> ToolResult:
        """
        Kjør browser-use med den gitte oppgaven.
        Streamer skjermbilder og handlinger live til frontend.
        """
        try:
            from browser_use import Agent, Browser, BrowserConfig
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

        try:
            # Konfigurer Playwright-nettleser (headless i produksjon)
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

            browser = Browser(config=browser_config)
            self._browser_instance = browser

            # Claude som LLM via LangChain
            llm = ChatAnthropic(
                model="claude-opus-4-5",
                anthropic_api_key=anthropic_key,
                temperature=0,
                max_tokens=4096,
            )

            # Bygg agent
            agent = Agent(
                task=task,
                llm=llm,
                browser=browser,
                max_actions_per_step=5,
                use_vision=True,
            )

            step_count = [0]

            async def on_step_end(agent_state: Any, result: Any, step_info: Any) -> None:
                step_count[0] += 1
                step_num = step_count[0]

                # Hent nåværende side for skjermbilde
                try:
                    ctx = agent.browser_context
                    if ctx:
                        pages = ctx.pages if hasattr(ctx, "pages") else []
                        if pages:
                            page = pages[-1]
                            screenshot_b64 = await self._take_screenshot_base64(page)
                            current_url = page.url

                            if screenshot_b64:
                                await self._emit("browser_screenshot", {
                                    "screenshot": screenshot_b64,
                                    "url": current_url,
                                    "step": step_num,
                                    "message": f"Steg {step_num}: {current_url}",
                                })

                            # Emit handlingsbeskrivelse fra resultat
                            if result:
                                results_list = result if isinstance(result, list) else [result]
                                for action_result in results_list:
                                    content = None
                                    if hasattr(action_result, "extracted_content"):
                                        content = action_result.extracted_content
                                    elif hasattr(action_result, "error") and action_result.error:
                                        content = f"Feil: {action_result.error}"
                                    if content:
                                        await self._emit("browser_action", {
                                            "step": step_num,
                                            "action": str(content)[:300],
                                            "url": current_url,
                                            "message": f"🖱️ {str(content)[:200]}",
                                        })
                except Exception:
                    pass

                # Sjekk om brukeren har bedt om å ta over
                if self._takeover_requested:
                    await self._emit("browser_takeover_active", {
                        "message": "⏸️ Agenten er satt på pause. Du har overtatt nettleseren.",
                    })
                    # Vent til brukeren er ferdig (maks 10 min)
                    try:
                        await asyncio.wait_for(
                            asyncio.shield(self._takeover_event.wait()),
                            timeout=600,
                        )
                    except asyncio.TimeoutError:
                        pass
                    self._takeover_requested = False
                    self._takeover_event.clear()
                    await self._emit("browser_takeover_ended", {
                        "message": "▶️ Agenten fortsetter arbeidet.",
                    })

            # Koble til step-callback
            agent.register_new_step_callback = on_step_end

            # Naviger til start-URL hvis angitt
            if start_url:
                await self._emit("browser_action", {
                    "step": 0,
                    "action": f"Navigerer til {start_url}",
                    "url": start_url,
                    "message": f"🔗 Navigerer til {start_url}",
                })

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

            # Ta sluttskjermbilde
            try:
                ctx = agent.browser_context
                if ctx:
                    pages = ctx.pages if hasattr(ctx, "pages") else []
                    if pages:
                        page = pages[-1]
                        screenshot_b64 = await self._take_screenshot_base64(page)
                        if screenshot_b64:
                            await self._emit("browser_screenshot", {
                                "screenshot": screenshot_b64,
                                "url": page.url,
                                "step": step_count[0] + 1,
                                "message": f"✅ Ferdig: {page.url}",
                                "is_final": True,
                            })
            except Exception:
                pass

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

        finally:
            try:
                if self._browser_instance:
                    await self._browser_instance.close()
                    self._browser_instance = None
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
