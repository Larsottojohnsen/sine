-- Migrasjon: legg til is_favorite og credits_used på conversations
-- Kjør dette i Supabase SQL Editor

ALTER TABLE public.conversations
  ADD COLUMN IF NOT EXISTS is_favorite BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS credits_used INTEGER DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_conversations_is_favorite
  ON public.conversations(user_id, is_favorite)
  WHERE is_favorite = TRUE;
