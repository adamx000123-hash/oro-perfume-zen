ALTER TABLE public.products ADD COLUMN description TEXT NOT NULL DEFAULT '';
ALTER TABLE public.products ADD COLUMN characteristics JSONB NOT NULL DEFAULT '[]'::jsonb;
COMMENT ON COLUMN public.products.notes IS 'DEPRECATED: replaced by description and characteristics';