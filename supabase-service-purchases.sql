-- Service Purchases Table
-- Run this in Supabase SQL Editor
CREATE TABLE IF NOT EXISTS public.service_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  telegram_id BIGINT REFERENCES public.users(telegram_id),
  service_id TEXT NOT NULL,
  price NUMERIC NOT NULL,
  payment_method TEXT NOT NULL DEFAULT 'balance',
  status TEXT NOT NULL DEFAULT 'pending',
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create unique constraint for upsert
CREATE UNIQUE INDEX IF NOT EXISTS idx_service_purchases_user_service 
ON public.service_purchases(telegram_id, service_id);

-- Disable RLS for serverless access
ALTER TABLE public.service_purchases DISABLE ROW LEVEL SECURITY;
