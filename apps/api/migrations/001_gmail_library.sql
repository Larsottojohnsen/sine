-- ── Gmail OAuth tokens ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.gmail_tokens (
  user_id       TEXT PRIMARY KEY,
  access_token  TEXT NOT NULL,
  refresh_token TEXT,
  token_type    TEXT DEFAULT 'Bearer',
  expires_in    INTEGER DEFAULT 3600,
  scope         TEXT DEFAULT '',
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- RLS: brukere kan bare se egne tokens
ALTER TABLE public.gmail_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own gmail tokens"
  ON public.gmail_tokens
  FOR ALL
  USING (user_id = auth.uid()::TEXT OR user_id = 'default');

-- ── Library documents (LightRAG-indekserte filer) ─────────────────────────────
CREATE TABLE IF NOT EXISTS public.library_documents (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     TEXT NOT NULL,
  filename    TEXT NOT NULL,
  file_type   TEXT NOT NULL,
  file_size   INTEGER DEFAULT 0,
  status      TEXT DEFAULT 'uploaded' CHECK (status IN ('uploaded', 'indexing', 'indexed', 'error')),
  error_msg   TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_library_docs_user ON public.library_documents (user_id);

ALTER TABLE public.library_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own library documents"
  ON public.library_documents
  FOR ALL
  USING (user_id = auth.uid()::TEXT OR user_id = 'default');

-- ── Oppdater messages role constraint for å tillate 'agent' ───────────────────
-- Fjern eksisterende constraint og legg til ny med 'agent' inkludert
ALTER TABLE public.messages
  DROP CONSTRAINT IF EXISTS messages_role_check;

ALTER TABLE public.messages
  ADD CONSTRAINT messages_role_check
  CHECK (role IN ('user', 'assistant', 'system', 'agent'));

-- ── Auto-update updated_at triggers ──────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_gmail_tokens_updated_at
  BEFORE UPDATE ON public.gmail_tokens
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_library_documents_updated_at
  BEFORE UPDATE ON public.library_documents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
