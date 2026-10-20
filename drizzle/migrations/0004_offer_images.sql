ALTER TABLE public.offers
  ADD COLUMN IF NOT EXISTS images text[] NOT NULL DEFAULT '{}';
