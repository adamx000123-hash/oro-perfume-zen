ALTER TABLE public.products ADD COLUMN main_accords jsonb NOT NULL DEFAULT '[]'::jsonb, ADD COLUMN when_to_wear jsonb NOT NULL DEFAULT '{}'::jsonb;

CREATE OR REPLACE FUNCTION public.validate_product_fragrance_profile() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
DECLARE item jsonb; k text; v jsonb;
BEGIN
  IF jsonb_typeof(NEW.main_accords) IS DISTINCT FROM 'array' OR jsonb_typeof(NEW.when_to_wear) IS DISTINCT FROM 'object' THEN
    RAISE EXCEPTION 'Invalid fragrance profile format';
  END IF;
  FOR item IN SELECT value FROM jsonb_array_elements(NEW.main_accords) LOOP
    IF jsonb_typeof(item) IS DISTINCT FROM 'object' OR jsonb_typeof(item->'name') IS DISTINCT FROM 'string' OR length(trim(item->>'name')) = 0 OR length(item->>'name') > 60 OR (item->>'color') IS NULL OR (item->>'color') NOT IN ('citrus','fresh','woody','sweet','floral','spicy') THEN
      RAISE EXCEPTION 'Accords require a name and a valid color';
    END IF;
    v := item->'percentage';
    IF v IS NOT NULL AND v <> 'null'::jsonb THEN
      IF jsonb_typeof(v) IS DISTINCT FROM 'number' THEN RAISE EXCEPTION 'Percentage must be a number'; END IF;
      IF (v::text)::numeric < 0 OR (v::text)::numeric > 100 THEN RAISE EXCEPTION 'Percentage must be between 0 and 100'; END IF;
    END IF;
  END LOOP;
  FOR k,v IN SELECT key,value FROM jsonb_each(NEW.when_to_wear) LOOP
    IF k NOT IN ('Winter','Spring','Summer','Fall','Day','Night') THEN RAISE EXCEPTION 'Invalid wearing option'; END IF;
    IF v <> 'null'::jsonb THEN
      IF jsonb_typeof(v) IS DISTINCT FROM 'number' THEN RAISE EXCEPTION 'Percentage must be a number'; END IF;
      IF (v::text)::numeric < 0 OR (v::text)::numeric > 100 THEN RAISE EXCEPTION 'Percentage must be between 0 and 100'; END IF;
    END IF;
  END LOOP;
  RETURN NEW;
END;
$$;
CREATE TRIGGER validate_product_fragrance_profile BEFORE INSERT OR UPDATE OF main_accords, when_to_wear ON public.products FOR EACH ROW EXECUTE FUNCTION public.validate_product_fragrance_profile();