"""
Filesystem Tool – lese, skrive og liste filer i workspace
"""
from __future__ import annotations
import os
from pathlib import Path
from tools.base import BaseTool
from schemas.agent import ToolResult, RiskLevel


class ReadFileTool(BaseTool):
    name = "read_file"
    description = "Les innholdet i en fil fra workspace. Returner filinnholdet som tekst."
    risk_level = RiskLevel.LOW

    def __init__(self, workspace_dir: str):
        self.workspace_dir = Path(workspace_dir)

    def _safe_path(self, path: str) -> Path:
        full = (self.workspace_dir / path).resolve()
        if not str(full).startswith(str(self.workspace_dir.resolve())):
            raise ValueError("Path traversal forsøk blokkert")
        return full

    async def execute(self, path: str) -> ToolResult:
        try:
            full_path = self._safe_path(path)
            if not full_path.exists():
                return ToolResult(tool=self.name, success=False, output="", error=f"Fil ikke funnet: {path}")
            content = full_path.read_text(encoding="utf-8", errors="replace")
            return ToolResult(tool=self.name, success=True, output=content[:20000])
        except Exception as e:
            return ToolResult(tool=self.name, success=False, output="", error=str(e))

    def get_input_schema(self) -> dict:
        return {
            "type": "object",
            "properties": {
                "path": {"type": "string", "description": "Relativ sti til filen i workspace"}
            },
            "required": ["path"]
        }


class WriteFileTool(BaseTool):
    name = "write_file"
    description = "Skriv eller opprett en fil i workspace med gitt innhold. Oppretter mapper automatisk."
    risk_level = RiskLevel.LOW

    def __init__(self, workspace_dir: str):
        self.workspace_dir = Path(workspace_dir)

    def _safe_path(self, path: str) -> Path:
        full = (self.workspace_dir / path).resolve()
        if not str(full).startswith(str(self.workspace_dir.resolve())):
            raise ValueError("Path traversal forsøk blokkert")
        return full

    async def execute(self, path: str, content: str) -> ToolResult:
        try:
            full_path = self._safe_path(path)
            full_path.parent.mkdir(parents=True, exist_ok=True)
            full_path.write_text(content, encoding="utf-8")
            return ToolResult(
                tool=self.name,
                success=True,
                output=f"Fil skrevet: {path} ({len(content)} tegn)",
                files_created=[path]
            )
        except Exception as e:
            return ToolResult(tool=self.name, success=False, output="", error=str(e))

    def get_input_schema(self) -> dict:
        return {
            "type": "object",
            "properties": {
                "path": {"type": "string", "description": "Relativ sti til filen"},
                "content": {"type": "string", "description": "Innholdet som skal skrives"}
            },
            "required": ["path", "content"]
        }


class ListFilesTool(BaseTool):
    name = "list_files"
    description = "List alle filer og mapper i workspace eller en undermappe."
    risk_level = RiskLevel.LOW

    def __init__(self, workspace_dir: str):
        self.workspace_dir = Path(workspace_dir)

    async def execute(self, path: str = ".") -> ToolResult:
        try:
            target = (self.workspace_dir / path).resolve()
            if not str(target).startswith(str(self.workspace_dir.resolve())):
                raise ValueError("Path traversal blokkert")

            lines = []
            for item in sorted(target.rglob("*")):
                rel = item.relative_to(self.workspace_dir)
                prefix = "📁 " if item.is_dir() else "📄 "
                lines.append(f"{prefix}{rel}")

            output = "\n".join(lines[:200]) if lines else "(tom workspace)"
            return ToolResult(tool=self.name, success=True, output=output)
        except Exception as e:
            return ToolResult(tool=self.name, success=False, output="", error=str(e))

    def get_input_schema(self) -> dict:
        return {
            "type": "object",
            "properties": {
                "path": {"type": "string", "description": "Mappe å liste (default: rot)", "default": "."}
            }
        }
