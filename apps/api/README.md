# Sine API

FastAPI-backend for Sine AI-plattformen med agent-orkestrator, WebSocket-streaming og verktøy-system.

## Arkitektur

```
apps/api/
├── main.py              # FastAPI app med CORS og routing
├── agent/
│   └── orchestrator.py  # SineOrchestrator – ReAct-loop med Claude
├── routes/
│   └── agent.py         # REST + WebSocket endepunkter
├── schemas/
│   └── agent.py         # Pydantic-modeller
├── tools/
│   ├── terminal.py      # Bash/Python-kjøring
│   ├── filesystem.py    # Fil-operasjoner
│   ├── search.py        # DuckDuckGo-søk
│   └── git.py           # GitHub clone
├── Dockerfile
└── railway.json
```

## Endepunkter

| Metode | Sti | Beskrivelse |
|--------|-----|-------------|
| `POST` | `/api/agent/start` | Start ny agent-kjøring |
| `WS` | `/api/agent/ws/{run_id}` | WebSocket for real-time events |
| `POST` | `/api/agent/{run_id}/approve` | Godkjenn ventende operasjon |
| `POST` | `/api/agent/{run_id}/stop` | Stopp agenten |
| `GET` | `/api/agent/{run_id}/files` | List alle filer i workspace |
| `GET` | `/api/agent/{run_id}/files/{path}` | Hent filinnhold |
| `GET` | `/health` | Helsesjekk |

## WebSocket Event-format

```json
{
  "type": "status|log|tool_call|tool_result|file_change|approval_needed|complete|error",
  "timestamp": 1234567890.123,
  "data": { ... }
}
```

## Lokal utvikling

```bash
cd apps/api
cp .env.example .env
# Rediger .env og legg inn ANTHROPIC_API_KEY
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

## Railway Deployment

1. Opprett et nytt Railway-prosjekt
2. Koble til GitHub-repoet `Larsottojohnsen/sine`
3. Sett root directory til `apps/api`
4. Legg til miljøvariabler:
   - `ANTHROPIC_API_KEY` – Claude API-nøkkel
   - `FRONTEND_URL` – `https://larsottojohnsen.github.io`
5. Deploy

Etter deploy, kopier Railway-URL og legg til som `VITE_API_URL` i GitHub Secrets.

## Safe Mode

- **Safe Mode (standard)**: Blokkerer destruktive kommandoer, krever godkjenning for høy-risiko operasjoner
- **Power Mode**: Utvidede tillatelser, men fortsatt grunnleggende sikkerhetskontroller
