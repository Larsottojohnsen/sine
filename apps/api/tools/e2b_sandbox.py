"""
E2B Sandbox Tool – cloud-isolert kodekjøring via E2B
Erstatter lokal terminal med en sikker, skalerbar sandkasse.
"""
from __future__ import annotations
import asyncio
import os
from typing import Optional
from tools.base import BaseTool
from schemas.agent import ToolResult, RiskLevel

E2B_API_KEY = os.getenv("E2B_API_KEY") or os.getenv("e2b_adc2a4765b2c0b1e4e7c291a5de3910160041901")


class E2BSandboxTool(BaseTool):
    """
    Kjører kode og bash-kommandoer i en isolert E2B cloud-sandkasse.
    Hver agent-run får sin egen sandkasse som lever i hele session.
    """
    name = "terminal"
    description = (
        "Kjør bash-kommandoer eller Python-kode i en sikker cloud-sandkasse. "
        "Kan opprette filer, installere pakker, kjøre scripts, klone repos, "
        "og analysere feilmeldinger. Alle kommandoer kjøres i /home/user/workspace."
    )
    risk_level = RiskLevel.LOW  # E2B er allerede isolert

    def __init__(self, run_id: str, safe_mode: bool = True):
        self.run_id = run_id
        self.safe_mode = safe_mode
        self._sandbox = None
        self._lock = asyncio.Lock()

    async def _get_sandbox(self):
        """Hent eller opprett sandkasse (lazy init)"""
        if self._sandbox is not None:
            return self._sandbox

        async with self._lock:
            if self._sandbox is not None:
                return self._sandbox

            try:
                from e2b_code_interpreter import AsyncSandbox
                self._sandbox = await AsyncSandbox.create(
                    api_key=E2B_API_KEY,
                    timeout=300,  # 5 minutter maks levetid
                )
                # Sett opp workspace-mappe
                await self._sandbox.commands.run("mkdir -p /home/user/workspace")
            except ImportError:
                raise RuntimeError("e2b_code_interpreter er ikke installert. Kjør: pip install e2b-code-interpreter")
            except Exception as e:
                raise RuntimeError(f"Kunne ikke opprette E2B sandkasse: {e}")

        return self._sandbox

    async def execute(self, command: str, timeout: int = 60) -> ToolResult:
        # Safe mode: blokker destruktive kommandoer
        if self.safe_mode:
            blocked = ["sudo su", "sudo -i", "su root", "passwd", "rm -rf /", "mkfs"]
            cmd_lower = command.lower()
            for b in blocked:
                if b in cmd_lower:
                    return ToolResult(
                        tool=self.name,
                        success=False,
                        output="",
                        error=f"Blokkert kommando i Safe Mode: {b}"
                    )

        try:
            sandbox = await self._get_sandbox()

            # Kjør kommandoen i workspace-mappen
            result = await sandbox.commands.run(
                f"cd /home/user/workspace && {command}",
                timeout=timeout,
            )

            output = result.stdout or ""
            error = result.stderr or ""
            combined = output
            if error:
                combined += f"\n[stderr]: {error}"

            return ToolResult(
                tool=self.name,
                success=result.exit_code == 0,
                output=combined[:8000],
                error=error[:2000] if result.exit_code != 0 else None
            )

        except Exception as e:
            return ToolResult(
                tool=self.name,
                success=False,
                output="",
                error=f"E2B feil: {str(e)}"
            )

    async def run_python(self, code: str) -> ToolResult:
        """Kjør Python-kode direkte med full output inkl. plots"""
        try:
            sandbox = await self._get_sandbox()
            result = await sandbox.run_code(code)

            output_parts = []
            for out in result.logs.stdout:
                output_parts.append(out)

            # Inkluder eventuelle feil
            for err in result.logs.stderr:
                output_parts.append(f"[stderr]: {err}")

            output = "\n".join(output_parts)

            return ToolResult(
                tool="run_python",
                success=result.error is None,
                output=output[:8000],
                error=str(result.error) if result.error else None
            )
        except Exception as e:
            return ToolResult(
                tool="run_python",
                success=False,
                output="",
                error=f"E2B Python-feil: {str(e)}"
            )

    async def upload_file(self, local_path: str, remote_path: str) -> bool:
        """Last opp en fil til sandkassen"""
        try:
            sandbox = await self._get_sandbox()
            with open(local_path, "rb") as f:
                content = f.read()
            await sandbox.files.write(remote_path, content)
            return True
        except Exception:
            return False

    async def download_file(self, remote_path: str) -> Optional[bytes]:
        """Last ned en fil fra sandkassen"""
        try:
            sandbox = await self._get_sandbox()
            content = await sandbox.files.read(remote_path)
            return content
        except Exception:
            return None

    async def list_workspace_files(self) -> list[str]:
        """List alle filer i workspace"""
        try:
            sandbox = await self._get_sandbox()
            result = await sandbox.commands.run(
                "find /home/user/workspace -type f | sort"
            )
            if result.stdout:
                return [f.strip() for f in result.stdout.strip().split("\n") if f.strip()]
            return []
        except Exception:
            return []

    async def close(self):
        """Lukk sandkassen og frigjør ressurser"""
        if self._sandbox:
            try:
                await self._sandbox.kill()
            except Exception:
                pass
            self._sandbox = None

    def get_input_schema(self) -> dict:
        return {
            "type": "object",
            "properties": {
                "command": {
                    "type": "string",
                    "description": "Bash-kommandoen som skal kjøres i sandkassen"
                },
                "timeout": {
                    "type": "integer",
                    "description": "Maks sekunder å vente (default 60)",
                    "default": 60
                }
            },
            "required": ["command"]
        }
