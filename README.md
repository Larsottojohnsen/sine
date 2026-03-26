# Sine AI – Norsk AI-plattform

Sine er en norsk AI-plattform med chat og agentmodus, bygget med React, TypeScript og Tailwind CSS.

## Struktur

```
sine/
├── apps/
│   ├── web/          # React frontend (Chat UI)
│   ├── api/          # Backend API (TypeScript/Node – kommer)
│   └── admin/        # Adminpanel (kommer)
├── packages/
│   ├── ui/           # Delte UI-komponenter
│   ├── auth/         # Autentisering
│   ├── ai-gateway/   # AI-modellgateway
│   ├── agent-runtime-client/  # Agent-klient
│   └── shared-types/ # Delte TypeScript-typer
└── .github/
    └── workflows/    # GitHub Actions CI/CD
```

## Kom i gang

Krav: Node.js 20+ og pnpm 10+

```bash
pnpm install
pnpm dev
```

Opprett `apps/web/.env.local`:
```
VITE_CLAUDE_API_KEY=din-claude-api-nøkkel
```

## Designsystem

Mørkt designsystem inspirert av Manus AI og ChatGPT.
Font: -apple-system (system-font)
Brand: #1A93FE | Bakgrunn: #272727 | Sidebar: #212121

## Stack

React 19 + TypeScript + Tailwind CSS v4 + Claude API (streaming)
