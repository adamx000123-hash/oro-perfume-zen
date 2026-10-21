CREATE TABLE IF NOT EXISTS public.offer_gift_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  offer_id uuid NOT NULL REFERENCES public.offers(id) ON DELETE CASCADE,
  source_product_id text,
  name text NOT NULL,
  category text NOT NULL DEFAULT 'Unisex' CHECK (category IN ('Men', 'Women', 'Unisex')),
  family text NOT NULL DEFAULT '',
  price integer NOT NULL DEFAULT 0 CHECK (price >= 0),
  discount integer NOT NULL DEFAULT 0 CHECK (discount BETWEEN 0 AND 90),
  image text NOT NULL DEFAULT '',
  images text[] NOT NULL DEFAULT '{}',
  description text NOT NULL DEFAULT '',
  notes text[] NOT NULL DEFAULT ARRAY['', '', ''],
  characteristics jsonb NOT NULL DEFAULT '{}'::jsonb,
  main_accords jsonb NOT NULL DEFAULT '[]'::jsonb,
  when_to_wear jsonb NOT NULL DEFAULT '{}'::jsonb,
  sort integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.offer_gift_products
  ADD COLUMN IF NOT EXISTS source_product_id text;

CREATE INDEX IF NOT EXISTS offer_gift_products_offer_sort_idx
  ON public.offer_gift_products (offer_id, sort, created_at);
CREATE UNIQUE INDEX IF NOT EXISTS offer_gift_products_offer_source_unique
  ON public.offer_gift_products (offer_id, source_product_id);

GRANT SELECT ON public.offer_gift_products TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.offer_gift_products TO authenticated;
GRANT ALL ON public.offer_gift_products TO service_role;

ALTER TABLE public.offer_gift_products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public reads gifts from active offers" ON public.offer_gift_products;
CREATE POLICY "Public reads gifts from active offers"
  ON public.offer_gift_products FOR SELECT TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.offers
      WHERE offers.id = offer_gift_products.offer_id
        AND (offers.active OR public.has_role(auth.uid(), 'admin'))
    )
  );
DROP POLICY IF EXISTS "Admins insert offer gifts" ON public.offer_gift_products;
CREATE POLICY "Admins insert offer gifts"
  ON public.offer_gift_products FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
DROP POLICY IF EXISTS "Admins update offer gifts" ON public.offer_gift_products;
CREATE POLICY "Admins update offer gifts"
  ON public.offer_gift_products FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
DROP POLICY IF EXISTS "Admins delete offer gifts" ON public.offer_gift_products;
CREATE POLICY "Admins delete offer gifts"
  ON public.offer_gift_products FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Preserve any offer-only records created by the previous approach as offer-specific gifts.
DO $migration$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'products' AND column_name = 'listing_type'
  ) THEN
    EXECUTE $query$
      INSERT INTO public.offer_gift_products (
        offer_id, source_product_id, name, category, family, price, discount, image, images,
        description, notes, characteristics, main_accords, when_to_wear, sort, created_at
      )
      SELECT o.id, p.id, p.name, p.category, p.family, p.price, p.discount, p.image,
             COALESCE(
               NULLIF(ARRAY(SELECT jsonb_array_elements_text(to_jsonb(p) -> 'images')), ARRAY[]::text[]),
               ARRAY[p.image]
             ),
             p.description, p.notes, p.characteristics, p.main_accords, p.when_to_wear, p.sort, p.created_at
      FROM public.products p
      JOIN public.offers o ON p.id = ANY(o.product_ids)
      WHERE p.listing_type = 'offer'
      ON CONFLICT (offer_id, source_product_id) DO NOTHING
    $query$;

    EXECUTE $query$
      UPDATE public.offers o
      SET product_ids = ARRAY(
        SELECT linked.product_id
        FROM unnest(o.product_ids) AS linked(product_id)
        WHERE NOT EXISTS (
          SELECT 1 FROM public.products p
          WHERE p.id = linked.product_id AND p.listing_type = 'offer'
        )
      )
      WHERE EXISTS (
        SELECT 1 FROM public.products p
        WHERE p.id = ANY(o.product_ids) AND p.listing_type = 'offer'
      )
    $query$;

    EXECUTE $query$ UPDATE public.products SET visible = false WHERE listing_type = 'offer' $query$;
    EXECUTE 'ALTER TABLE public.products DROP COLUMN listing_type';
  END IF;
END
$migration$;
