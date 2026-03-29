-- Sine AI Platform – Kreditter, Abonnementer og Referrals
-- Kjør dette i Supabase SQL Editor ETTER supabase_schema.sql

-- ============================================================
-- OPPDATER PROFILES med plan og kreditter
-- ============================================================
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS plan TEXT NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'pro')),
  ADD COLUMN IF NOT EXISTS credits INTEGER NOT NULL DEFAULT 50,
  ADD COLUMN IF NOT EXISTS referral_code TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS referred_by UUID REFERENCES public.profiles(id),
  ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT UNIQUE;

-- Generer referral_code automatisk ved opprettelse
CREATE OR REPLACE FUNCTION generate_referral_code()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.referral_code IS NULL THEN
    NEW.referral_code := upper(substring(replace(gen_random_uuid()::text, '-', ''), 1, 8));
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_referral_code
  BEFORE INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION generate_referral_code();

-- ============================================================
-- SUBSCRIPTIONS (Stripe-abonnementer)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  stripe_subscription_id TEXT UNIQUE,
  stripe_price_id     TEXT,
  plan                TEXT NOT NULL DEFAULT 'pro' CHECK (plan IN ('pro')),
  status              TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'canceled', 'past_due', 'trialing')),
  current_period_start TIMESTAMPTZ,
  current_period_end  TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Brukere kan se sine egne abonnementer"
  ON public.subscriptions FOR SELECT USING (auth.uid() = user_id);
CREATE INDEX idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX idx_subscriptions_stripe_id ON public.subscriptions(stripe_subscription_id);

-- ============================================================
-- CREDIT_TRANSACTIONS (historikk over kredittbruk og kjøp)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.credit_transactions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount      INTEGER NOT NULL,  -- positivt = tildelt, negativt = brukt
  type        TEXT NOT NULL CHECK (type IN ('signup_bonus', 'referral_bonus', 'purchase', 'usage_chat', 'usage_agent', 'pro_monthly', 'admin_grant')),
  description TEXT,
  metadata    JSONB DEFAULT '{}',  -- f.eks. stripe_payment_intent_id, conversation_id
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.credit_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Brukere kan se sine egne transaksjoner"
  ON public.credit_transactions FOR SELECT USING (auth.uid() = user_id);
CREATE INDEX idx_credit_transactions_user_id ON public.credit_transactions(user_id);
CREATE INDEX idx_credit_transactions_created_at ON public.credit_transactions(created_at DESC);

-- ============================================================
-- REFERRALS (hvem har henvist hvem)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.referrals (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id     UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  referred_id     UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  credits_granted BOOLEAN DEFAULT FALSE,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(referred_id)
);
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Brukere kan se sine egne referrals"
  ON public.referrals FOR SELECT USING (auth.uid() = referrer_id OR auth.uid() = referred_id);
CREATE INDEX idx_referrals_referrer_id ON public.referrals(referrer_id);

-- ============================================================
-- CREDIT_PACKAGES (tilgjengelige pakker for kjøp)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.credit_packages (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            TEXT NOT NULL,
  credits         INTEGER NOT NULL,
  price_nok       INTEGER NOT NULL,  -- i øre (f.eks. 7900 = 79 kr)
  stripe_price_id TEXT,
  is_active       BOOLEAN DEFAULT TRUE,
  sort_order      INTEGER DEFAULT 0
);

-- Sett inn standard pakker
INSERT INTO public.credit_packages (name, credits, price_nok, sort_order) VALUES
  ('1 000 kreditter',  1000,  7900,  1),
  ('2 000 kreditter',  2000,  14900, 2),
  ('5 000 kreditter',  5000,  34900, 3),
  ('10 000 kreditter', 10000, 64900, 4)
ON CONFLICT DO NOTHING;

-- ============================================================
-- FUNKSJON: Trekk kreditter ved meldingsbruk
-- ============================================================
CREATE OR REPLACE FUNCTION deduct_credits(
  p_user_id UUID,
  p_amount INTEGER,
  p_type TEXT,
  p_description TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'
)
RETURNS BOOLEAN AS $$
DECLARE
  current_credits INTEGER;
BEGIN
  SELECT credits INTO current_credits FROM public.profiles WHERE id = p_user_id FOR UPDATE;
  IF current_credits < p_amount THEN
    RETURN FALSE;  -- Ikke nok kreditter
  END IF;
  UPDATE public.profiles SET credits = credits - p_amount WHERE id = p_user_id;
  INSERT INTO public.credit_transactions (user_id, amount, type, description, metadata)
    VALUES (p_user_id, -p_amount, p_type, p_description, p_metadata);
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- FUNKSJON: Legg til kreditter
-- ============================================================
CREATE OR REPLACE FUNCTION add_credits(
  p_user_id UUID,
  p_amount INTEGER,
  p_type TEXT,
  p_description TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'
)
RETURNS VOID AS $$
BEGIN
  UPDATE public.profiles SET credits = credits + p_amount WHERE id = p_user_id;
  INSERT INTO public.credit_transactions (user_id, amount, type, description, metadata)
    VALUES (p_user_id, p_amount, p_type, p_description, p_metadata);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- FUNKSJON: Håndter referral ved ny bruker
-- ============================================================
CREATE OR REPLACE FUNCTION handle_referral_signup(
  p_new_user_id UUID,
  p_referral_code TEXT
)
RETURNS VOID AS $$
DECLARE
  v_referrer_id UUID;
BEGIN
  SELECT id INTO v_referrer_id FROM public.profiles WHERE referral_code = p_referral_code;
  IF v_referrer_id IS NULL OR v_referrer_id = p_new_user_id THEN RETURN; END IF;

  -- Registrer referral
  INSERT INTO public.referrals (referrer_id, referred_id, credits_granted)
    VALUES (v_referrer_id, p_new_user_id, TRUE)
    ON CONFLICT (referred_id) DO NOTHING;

  -- Gi 100 kreditter til begge
  PERFORM add_credits(v_referrer_id, 100, 'referral_bonus', 'Referral bonus – ny bruker registrerte seg', jsonb_build_object('referred_user_id', p_new_user_id));
  PERFORM add_credits(p_new_user_id, 100, 'referral_bonus', 'Velkomstbonus – henvist av en venn', jsonb_build_object('referrer_id', v_referrer_id));

  -- Oppdater referred_by på ny bruker
  UPDATE public.profiles SET referred_by = v_referrer_id WHERE id = p_new_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- OPPDATER handle_new_user til å gi signup-bonus
-- ============================================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
    VALUES (NEW.id, NEW.email)
    ON CONFLICT (id) DO NOTHING;

  -- Gi 50 kreditter ved registrering
  PERFORM add_credits(NEW.id, 50, 'signup_bonus', 'Velkomstbonus ved registrering');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- TRIGGER: Månedlig Pro-kreditter (kjøres via Stripe webhook)
-- ============================================================
-- NB: Pro-månedskreditter (1000) tildeles via backend webhook
-- når Stripe sender invoice.paid event

-- ============================================================
-- VIEW: Brukerstatistikk for profil-visning
-- ============================================================
CREATE OR REPLACE VIEW public.user_stats AS
SELECT
  p.id,
  p.credits,
  p.plan,
  p.referral_code,
  (SELECT COUNT(*) FROM public.referrals WHERE referrer_id = p.id) AS referral_count,
  (SELECT COUNT(*) FROM public.conversations WHERE user_id = p.id) AS conversation_count,
  (SELECT COALESCE(SUM(CASE WHEN amount < 0 THEN ABS(amount) ELSE 0 END), 0)
   FROM public.credit_transactions WHERE user_id = p.id) AS total_credits_used
FROM public.profiles p;

CREATE POLICY "Brukere kan se sin egen statistikk"
  ON public.credit_transactions FOR SELECT USING (auth.uid() = user_id);
