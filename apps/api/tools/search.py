"""
Web Search Tool – DuckDuckGo søk
"""
from __future__ import annotations
from tools.base import BaseTool
from schemas.agent import ToolResult, RiskLevel

try:
    from duckduckgo_search import DDGS
    HAS_DDG = True
except ImportError:
    HAS_DDG = False


class WebSearchTool(BaseTool):
    name = "web_search"
    description = (
        "Søk på internett etter informasjon, dokumentasjon, nyheter eller fakta. "
        "Returner topp resultater med tittel, URL og sammendrag."
    )
    risk_level = RiskLevel.LOW

    async def execute(self, query: str, max_results: int = 5) -> ToolResult:
        if not HAS_DDG:
            return ToolResult(
                tool=self.name,
                success=False,
                output="",
                error="duckduckgo-search er ikke installert"
            )

        try:
            results = []
            with DDGS() as ddgs:
                for r in ddgs.text(query, max_results=max_results):
                    results.append(
                        f"**{r.get('title', 'Uten tittel')}**\n"
                        f"URL: {r.get('href', '')}\n"
                        f"{r.get('body', '')}\n"
                    )

            if not results:
                return ToolResult(
                    tool=self.name,
                    success=True,
                    output="Ingen resultater funnet for søket."
                )

            output = f"Søkeresultater for: '{query}'\n\n" + "\n---\n".join(results)
            return ToolResult(tool=self.name, success=True, output=output)

        except Exception as e:
            return ToolResult(
                tool=self.name,
                success=False,
                output="",
                error=f"Søkefeil: {str(e)}"
            )

    def get_input_schema(self) -> dict:
        return {
            "type": "object",
            "properties": {
                "query": {"type": "string", "description": "Søketeksten"},
                "max_results": {
                    "type": "integer",
                    "description": "Maks antall resultater (default 5)",
                    "default": 5
                }
            },
            "required": ["query"]
        }
