-- ============================================================
-- Sine Agentic Calendar — Supabase Schema
-- All timestamps stored in UTC, displayed in Europe/Oslo (CET/CEST)
-- ============================================================

-- ── recurring_tasks ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS recurring_tasks (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Display
  title           TEXT NOT NULL,
  description     TEXT,
  category        TEXT NOT NULL DEFAULT 'Tilpasset',
  color           TEXT NOT NULL DEFAULT '#1A93FE',   -- hex, dynamically assigned

  -- Schedule (Norwegian time, stored as UTC offset handled in app)
  frequency       TEXT NOT NULL CHECK (frequency IN ('daily','weekly','monthly','custom')),
  -- custom_days: JSON array of weekday numbers 0=Mon..6=Sun, e.g. [2,4] = Wed+Fri
  custom_days     JSONB,
  -- time_of_day: HH:MM in Europe/Oslo
  time_of_day     TEXT NOT NULL DEFAULT '09:00',
  -- For weekly: day_of_week 0=Mon..6=Sun
  day_of_week     INTEGER CHECK (day_of_week BETWEEN 0 AND 6),
  -- For monthly: day_of_month 1-31
  day_of_month    INTEGER CHECK (day_of_month BETWEEN 1 AND 31),

  -- Lifecycle
  starts_at       DATE NOT NULL DEFAULT CURRENT_DATE,
  ends_at         DATE,           -- NULL = never ends
  is_active       BOOLEAN NOT NULL DEFAULT false,  -- false until user clicks "Aktiver"
  auto_approved   BOOLEAN NOT NULL DEFAULT false,  -- mirrors user setting at creation time

  -- Agent / connector metadata
  connector_id    TEXT,           -- e.g. 'github', 'gmail', 'meta-ads'
  agent_prompt    TEXT,           -- the prompt the agent will execute
  source          TEXT NOT NULL DEFAULT 'manual' CHECK (source IN ('agent','manual')),

  -- Timestamps
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for fast per-user queries
CREATE INDEX IF NOT EXISTS idx_recurring_tasks_user_id ON recurring_tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_recurring_tasks_active  ON recurring_tasks(user_id, is_active);

-- ── task_executions ───────────────────────────────────────────
-- One row per actual run (scheduled or manual "Run now")
CREATE TABLE IF NOT EXISTS task_executions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id         UUID NOT NULL REFERENCES recurring_tasks(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- When it ran (UTC)
  scheduled_for   TIMESTAMPTZ NOT NULL,
  started_at      TIMESTAMPTZ,
  finished_at     TIMESTAMPTZ,

  -- Outcome
  status          TEXT NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending','running','success','failed','skipped')),
  result_summary  TEXT,           -- short human-readable result
  error_message   TEXT,
  credits_used    INTEGER DEFAULT 0,
  triggered_by    TEXT NOT NULL DEFAULT 'scheduler' CHECK (triggered_by IN ('scheduler','manual')),

  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Keep only 90 days of execution history per user (run as a cron job in Supabase)
-- DELETE FROM task_executions WHERE created_at < NOW() - INTERVAL '90 days';

CREATE INDEX IF NOT EXISTS idx_task_executions_task_id   ON task_executions(task_id);
CREATE INDEX IF NOT EXISTS idx_task_executions_user_id   ON task_executions(user_id);
CREATE INDEX IF NOT EXISTS idx_task_executions_scheduled ON task_executions(scheduled_for DESC);

-- ── Row Level Security ────────────────────────────────────────
ALTER TABLE recurring_tasks   ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_executions   ENABLE ROW LEVEL SECURITY;

-- Users can only see/modify their own tasks
CREATE POLICY "Users manage own recurring tasks"
  ON recurring_tasks FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users manage own task executions"
  ON task_executions FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ── updated_at trigger ────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$;

CREATE TRIGGER trg_recurring_tasks_updated_at
  BEFORE UPDATE ON recurring_tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
