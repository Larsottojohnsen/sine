"""
Sine Agent Tools – Base klasse
Inspirert av OpenManus sin tool-arkitektur
"""
from __future__ import annotations
from abc import ABC, abstractmethod
from typing import Any
from schemas.agent import ToolResult, RiskLevel


class BaseTool(ABC):
    name: str
    description: str
    risk_level: RiskLevel = RiskLevel.LOW

    @abstractmethod
    async def execute(self, **kwargs) -> ToolResult:
        pass

    def to_claude_tool(self) -> dict:
        """Konverter til Claude tool-definisjon"""
        return {
            "name": self.name,
            "description": self.description,
            "input_schema": self.get_input_schema()
        }

    @abstractmethod
    def get_input_schema(self) -> dict:
        pass
