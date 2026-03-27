# Sine AI Agent – Backend & API Arkitekturplan

Dette dokumentet beskriver den tekniske arkitekturen og API-designet som kreves for å bygge backend-systemet til Sine. Arkitekturen er sterkt inspirert av Manus sin "CodeAct"-tilnærming, med fokus på en autonom kode-agent som kan planlegge, utføre kode i en sandkasse, og huske kontekst på tvers av samtaler.

## 1. Systemarkitektur Oversikt

Systemet består av fire hovedkomponenter:
1. **Frontend (React/Vite)**: Håndterer UI, event-stream visualisering, og brukerinteraksjon.
2. **Backend (Node.js/Python)**: Orkestrerer agent-loopen, håndterer API-kall, og administrerer minne.
3. **LLM Core (Claude 3.5/3.7)**: Selve "hjernen" som resonnerer, planlegger og skriver kode.
4. **Execution Sandbox (f.eks. E2B)**: Et isolert skymiljø (Ubuntu/Linux) hvor agentens kode faktisk kjøres.

## 2. Agent Loop (Kjernelogikken)

I stedet for en enkel "request-response"-flyt, må backend implementere en iterativ **Agent Loop**:

1. **Analyze**: Backend mottar brukerens melding og henter relevant historikk/minne.
2. **Plan**: LLM genererer eller oppdaterer en steg-for-steg plan (`todo.md`).
3. **Act (CodeAct)**: LLM velger et verktøy, primært ved å skrive Python-kode.
4. **Execute**: Backend sender koden til Sandkassen (E2B) for kjøring.
5. **Observe**: Backend mottar output/feilmeldinger fra Sandkassen og legger det til i konteksten.
6. **Iterate**: Loopen gjentas til LLM vurderer oppgaven som ferdig.
7. **Respond**: Endelig resultat sendes til brukeren.

## 3. API Design (WebSocket / Server-Sent Events)

Siden agenten jobber iterativt og asynkront, er tradisjonelle REST API-er ikke tilstrekkelige for chat-flyten. Vi anbefaler **Server-Sent Events (SSE)** eller **WebSockets** for å streame events til frontend i sanntid.

### Hoved-endepunkt: `POST /api/chat/stream` (eller WSS)

**Request Payload:**
```json
{
  "conversationId": "conv_123",
  "message": "Lag et Python-script som skraper nyheter",
  "agentType": "code",
  "safeMode": true
}
```

**Streamede Events (Response):**
Backend må streame ulike typer events slik at frontend kan vise hva agenten tenker og gjør:

1. **Plan Event**: Oppdaterer sjekklisten i UI.
   ```json
   { "type": "plan", "steps": [{"id": 1, "text": "Søk etter nyhetskilder", "status": "pending"}] }
   ```
2. **Action Event**: Viser at agenten utfører en handling.
   ```json
   { "type": "action", "tool": "execute_python", "description": "Kjører skrape-script..." }
   ```
3. **Observation Event**: Viser resultatet av handlingen (f.eks. terminal-output).
   ```json
   { "type": "observation", "output": "Successfully scraped 15 articles." }
   ```
4. **Message Event**: Selve tekstsvaret fra agenten (streames token for token).
   ```json
   { "type": "message", "content": "Her er nyhetene jeg fant..." }
   ```
5. **Ask Event (Safe Mode)**: Stopper loopen og ber om brukerens godkjenning.
   ```json
   { "type": "ask_permission", "action": "Slette filen data.csv", "actionId": "act_456" }
   ```

## 4. Minne og Persistens (Memory Module)

For at Sine skal huske ting på tvers av samtaler (f.eks. "Jeg er student ved UiO"), trenger backend en minne-modul.

- **Korttidsminne (Event Stream)**: Lagres i en relasjonsdatabase (PostgreSQL/Supabase) per samtale. Inneholder hele historikken av meldinger, actions og observations.
- **Langtidsminne (Vector DB)**: Bruk f.eks. Pinecone eller Qdrant. Når brukeren oppgir personlig informasjon eller preferanser, trekker backend dette ut og lagrer det som embeddings. Ved nye samtaler gjøres et semantisk søk for å injisere relevant kontekst i system promptet.

## 5. Sandkasse-integrasjon (Live Kodekjøring)

For kode-agenten er det kritisk å kunne kjøre kode. Vi anbefaler å bruke **E2B (e2b.dev)**, som gir sikre, skybaserte sandkasser designet for AI-agenter.

**Flyt:**
1. Backend starter en E2B-sandkasse for samtalen.
2. LLM genererer Python-kode.
3. Backend sender koden til E2B via deres SDK.
4. E2B returnerer `stdout`, `stderr` og eventuelle filer (f.eks. genererte grafer).
5. Backend videresender dette til frontend som en `observation`.

## 6. Safe Mode Implementasjon

Når "Safe Mode" er aktivert i frontend, må backend endre agentens autonomi:

- **Safe Mode OFF**: Agenten kan kjøre kode, gjøre API-kall og endre filer i sandkassen uten å spørre. Loopen går automatisk til oppgaven er løst.
- **Safe Mode ON**: Før backend sender en destruktiv handling (f.eks. kjøre ukjent kode, slette filer, gjøre eksterne POST-requests) til sandkassen, settes loopen på pause. Backend sender en `ask_permission` event til frontend. Frontend viser en "Godkjenn / Avvis"-knapp. Backend venter på `POST /api/chat/approve` før loopen fortsetter.

## 7. System Prompts

Backend må administrere ulike system prompts basert på valgt agent:

- **Kode-agent**: Fokus på CodeAct, bruk av terminal, filsystem og E2B-sandkasse. Instrueres til å skrive kode for å løse problemer.
- **Skrive-agent**: Fokus på research, strukturering av lange dokumenter, og iterativ skriving. Instrueres til å bruke søkeverktøy og lagre utkast i filer.

---
*Dette dokumentet fungerer som en blueprint for backend-utvikleren når API-et skal bygges.*
