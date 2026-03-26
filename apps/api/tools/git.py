"""
Git Tool – klone repos og utføre git-operasjoner
"""
from __future__ import annotations
import asyncio
from pathlib import Path
from tools.base import BaseTool
from schemas.agent import ToolResult, RiskLevel


class GitCloneTool(BaseTool):
    name = "git_clone"
    description = "Klon et GitHub-repo til workspace. Støtter offentlige og private repos."
    risk_level = RiskLevel.LOW

    def __init__(self, workspace_dir: str):
        self.workspace_dir = Path(workspace_dir)

    async def execute(self, url: str, directory: str = "") -> ToolResult:
        try:
            dest = self.workspace_dir / (directory or url.split("/")[-1].replace(".git", ""))
            cmd = f"git clone --depth=1 {url} {dest}"

            process = await asyncio.create_subprocess_shell(
                cmd,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE,
                cwd=str(self.workspace_dir)
            )
            stdout, stderr = await asyncio.wait_for(process.communicate(), timeout=60)

            if process.returncode == 0:
                return ToolResult(
                    tool=self.name,
                    success=True,
                    output=f"Repo klonet til: {dest.relative_to(self.workspace_dir)}\n{stdout.decode()}"
                )
            else:
                return ToolResult(
                    tool=self.name,
                    success=False,
                    output="",
                    error=stderr.decode()
                )
        except asyncio.TimeoutError:
            return ToolResult(tool=self.name, success=False, output="", error="Kloning tidsavbrutt")
        except Exception as e:
            return ToolResult(tool=self.name, success=False, output="", error=str(e))

    def get_input_schema(self) -> dict:
        return {
            "type": "object",
            "properties": {
                "url": {"type": "string", "description": "GitHub repo URL"},
                "directory": {"type": "string", "description": "Mappe-navn i workspace (valgfri)"}
            },
            "required": ["url"]
        }
