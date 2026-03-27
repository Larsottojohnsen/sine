-- Sine AI Platform – Supabase Database Schema
-- Kjør dette i Supabase SQL Editor

-- ============================================================
-- USERS (utvider Supabase Auth)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.profiles (
    id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email       TEXT,
    display_name TEXT,
    avatar_url  TEXT,
    created_at  TIMESTAMPTZ DEFAULT NOW(),
    updated_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Brukere kan se og oppdatere sin egen profil"
    ON public.profiles FOR ALL USING (auth.uid() = id);

-- ============================================================
-- CONVERSATIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.conversations (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    title       TEXT NOT NULL DEFAULT 'Ny samtale',
    mode        TEXT NOT NULL DEFAULT 'chat' CHECK (mode IN ('chat', 'agent')),
    agent_type  TEXT DEFAULT 'code' CHECK (agent_type IN ('code', 'writing')),
    safe_mode   BOOLEAN DEFAULT TRUE,
    created_at  TIMESTAMPTZ DEFAULT NOW(),
    updated_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Brukere kan kun se sine egne samtaler"
    ON public.conversations FOR ALL USING (auth.uid() = user_id);

CREATE INDEX idx_conversations_user_id ON public.conversations(user_id);
CREATE INDEX idx_conversations_updated_at ON public.conversations(updated_at DESC);

-- ============================================================
-- MESSAGES
-- ============================================================
CREATE TABLE IF NOT EXISTS public.messages (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE,
    role            TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content         TEXT NOT NULL,
    metadata        JSONB DEFAULT '{}',
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Brukere kan kun se meldinger i sine samtaler"
    ON public.messages FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.conversations
            WHERE id = messages.conversation_id
            AND user_id = auth.uid()
        )
    );

CREATE INDEX idx_messages_conversation_id ON public.messages(conversation_id);
CREATE INDEX idx_messages_created_at ON public.messages(created_at);

-- ============================================================
-- USER MEMORY
-- ============================================================
CREATE TABLE IF NOT EXISTS public.user_memory (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    key         TEXT NOT NULL,
    value       TEXT NOT NULL,
    source      TEXT DEFAULT 'manuelt',
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.user_memory ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Brukere kan kun se sitt eget minne"
    ON public.user_memory FOR ALL USING (auth.uid() = user_id);

CREATE INDEX idx_user_memory_user_id ON public.user_memory(user_id);

-- ============================================================
-- AGENT FILES (filer produsert av agenten)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.agent_files (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE,
    name            TEXT NOT NULL,
    path            TEXT NOT NULL,
    type            TEXT DEFAULT 'other',
    size_bytes      INTEGER DEFAULT 0,
    storage_path    TEXT,  -- Supabase Storage path
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.agent_files ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Brukere kan kun se filer fra sine samtaler"
    ON public.agent_files FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.conversations
            WHERE id = agent_files.conversation_id
            AND user_id = auth.uid()
        )
    );

CREATE INDEX idx_agent_files_conversation_id ON public.agent_files(conversation_id);

-- ============================================================
-- TRIGGER: oppdater updated_at automatisk
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER conversations_updated_at
    BEFORE UPDATE ON public.conversations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- TRIGGER: opprett profil automatisk ved ny bruker
-- ============================================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email)
    VALUES (NEW.id, NEW.email)
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();
