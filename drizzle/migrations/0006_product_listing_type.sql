ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS listing_type text NOT NULL DEFAULT 'product';

ALTER TABLE public.products
  DROP CONSTRAINT IF EXISTS products_listing_type_check;

ALTER TABLE public.products
  ADD CONSTRAINT products_listing_type_check
  CHECK (listing_type IN ('product', 'offer'));
