"""
Terminal Tool – kjøre bash/python kommandoer i isolert workspace
"""
from __future__ import annotations
import asyncio
import os
import shlex
from pathlib import Path
from tools.base import BaseTool
from schemas.agent import ToolResult, RiskLevel

# Kommandoer som er høy-risiko i safe mode
HIGH_RISK_COMMANDS = [
    "rm -rf", "sudo", "chmod 777", "dd if=", "mkfs",
    "curl | bash", "wget | bash", "> /dev/", "shutdown",
    "reboot", "kill -9", "pkill", ":(){ :|:& };:",
]

# Kommandoer som alltid er blokkert
BLOCKED_COMMANDS = [
    "sudo su", "sudo -i", "su root", "passwd",
]


class TerminalTool(BaseTool):
    name = "terminal"
    description = (
        "Kjør bash-kommandoer eller Python-kode i workspace-sandboxen. "
        "Kan opprette filer, installere pakker, kjøre scripts, klone repos, "
        "og analysere feilmeldinger. Alle kommandoer kjøres i workspace-mappen."
    )
    risk_level = RiskLevel.MEDIUM

    def __init__(self, workspace_dir: str, safe_mode: bool = True):
        self.workspace_dir = Path(workspace_dir)
        self.workspace_dir.mkdir(parents=True, exist_ok=True)
        self.safe_mode = safe_mode

    def _check_risk(self, command: str) -> tuple[bool, str]:
        """Sjekk om kommandoen er blokkert eller høy-risiko"""
        cmd_lower = command.lower()

        for blocked in BLOCKED_COMMANDS:
            if blocked in cmd_lower:
                return False, f"Blokkert kommando: {blocked}"

        if self.safe_mode:
            for risky in HIGH_RISK_COMMANDS:
                if risky in cmd_lower:
                    return False, f"Høy-risiko kommando blokkert i Safe Mode: {risky}"

        return True, ""

    async def execute(self, command: str, timeout: int = 30) -> ToolResult:
        allowed, reason = self._check_risk(command)
        if not allowed:
            return ToolResult(
                tool=self.name,
                success=False,
                output="",
                error=f"Kommando blokkert: {reason}"
            )

        try:
            process = await asyncio.create_subprocess_shell(
                command,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE,
                cwd=str(self.workspace_dir),
                env={**os.environ, "HOME": str(self.workspace_dir)}
            )

            try:
                stdout, stderr = await asyncio.wait_for(
                    process.communicate(), timeout=timeout
                )
            except asyncio.TimeoutError:
                process.kill()
                return ToolResult(
                    tool=self.name,
                    success=False,
                    output="",
                    error=f"Kommando tidsavbrutt etter {timeout} sekunder"
                )

            output = stdout.decode("utf-8", errors="replace")
            error_output = stderr.decode("utf-8", errors="replace")

            combined = output
            if error_output:
                combined += f"\n[stderr]: {error_output}"

            return ToolResult(
                tool=self.name,
                success=process.returncode == 0,
                output=combined[:8000],  # Begrens output
                error=error_output[:2000] if process.returncode != 0 else None
            )

        except Exception as e:
            return ToolResult(
                tool=self.name,
                success=False,
                output="",
                error=str(e)
            )

    def get_input_schema(self) -> dict:
        return {
            "type": "object",
            "properties": {
                "command": {
                    "type": "string",
                    "description": "Bash-kommandoen som skal kjøres"
                },
                "timeout": {
                    "type": "integer",
                    "description": "Maks sekunder å vente (default 30)",
                    "default": 30
                }
            },
            "required": ["command"]
        }
