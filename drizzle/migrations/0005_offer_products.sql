ALTER TABLE public.offers
  ADD COLUMN IF NOT EXISTS product_ids text[] NOT NULL DEFAULT '{}';
