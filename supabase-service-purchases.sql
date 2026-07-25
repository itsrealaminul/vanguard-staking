CREATE TABLE IF NOT EXISTS public.service_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  telegram_id BIGINT,
  service_id TEXT NOT NULL,
  price NUMERIC NOT NULL,
  payment_method TEXT NOT NULL DEFAULT 'balance',
  status TEXT NOT NULL DEFAULT 'pending',
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
)
