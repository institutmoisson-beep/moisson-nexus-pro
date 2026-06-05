
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS id_moissonneur text UNIQUE,
  ADD COLUMN IF NOT EXISTS verification_token uuid NOT NULL DEFAULT gen_random_uuid(),
  ADD COLUMN IF NOT EXISTS est_souverain boolean NOT NULL DEFAULT false;

-- Backfill id_moissonneur for existing rows
UPDATE public.profiles
SET id_moissonneur = 'MS-' || to_char(COALESCE(created_at, now()), 'YYYY') || '-' || upper(substr(replace(id::text,'-',''),1,6))
WHERE id_moissonneur IS NULL;

-- Trigger to auto-fill id_moissonneur on insert
CREATE OR REPLACE FUNCTION public.set_id_moissonneur()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.id_moissonneur IS NULL THEN
    NEW.id_moissonneur := 'MS-' || to_char(now(),'YYYY') || '-' || upper(substr(replace(NEW.id::text,'-',''),1,6));
  END IF;
  IF NEW.verification_token IS NULL THEN
    NEW.verification_token := gen_random_uuid();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_set_id_moissonneur ON public.profiles;
CREATE TRIGGER trg_set_id_moissonneur
BEFORE INSERT ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.set_id_moissonneur();

-- Public verification RPC: returns minimal info needed for the scanner
CREATE OR REPLACE FUNCTION public.verify_moissonneur(_token uuid)
RETURNS TABLE(
  id_moissonneur text,
  full_name text,
  avatar_url text,
  career_level text,
  is_mlm_active boolean,
  est_souverain boolean,
  is_suspended boolean
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    p.id_moissonneur,
    (COALESCE(p.first_name,'') || ' ' || COALESCE(p.last_name,''))::text,
    p.avatar_url,
    p.career_level::text,
    p.is_mlm_active,
    p.est_souverain,
    p.is_suspended
  FROM public.profiles p
  WHERE p.verification_token = _token
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.verify_moissonneur(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.verify_moissonneur(uuid) TO anon, authenticated;
