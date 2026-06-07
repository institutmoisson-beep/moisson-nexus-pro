
-- 1) profiles : restreindre l'UPDATE aux colonnes sûres via un trigger
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

CREATE POLICY "Users can update own profile safe fields"
ON public.profiles
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.profiles_block_sensitive_self_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Admin bypass
  IF public.has_role(auth.uid(), 'admin'::app_role) THEN
    RETURN NEW;
  END IF;

  IF NEW.wallet_balance     IS DISTINCT FROM OLD.wallet_balance
  OR NEW.career_level       IS DISTINCT FROM OLD.career_level
  OR NEW.is_mlm_active      IS DISTINCT FROM OLD.is_mlm_active
  OR NEW.is_suspended       IS DISTINCT FROM OLD.is_suspended
  OR NEW.is_verified        IS DISTINCT FROM OLD.is_verified
  OR NEW.verified_at        IS DISTINCT FROM OLD.verified_at
  OR NEW.verified_by        IS DISTINCT FROM OLD.verified_by
  OR NEW.est_souverain      IS DISTINCT FROM OLD.est_souverain
  OR NEW.id_moissonneur     IS DISTINCT FROM OLD.id_moissonneur
  OR NEW.referral_code      IS DISTINCT FROM OLD.referral_code
  OR NEW.referred_by        IS DISTINCT FROM OLD.referred_by
  OR NEW.verification_token IS DISTINCT FROM OLD.verification_token
  OR NEW.user_id            IS DISTINCT FROM OLD.user_id
  THEN
    RAISE EXCEPTION 'Modification interdite : champ protégé du profil';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_block_sensitive_self_update ON public.profiles;
CREATE TRIGGER profiles_block_sensitive_self_update
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.profiles_block_sensitive_self_update();

-- 2) mandate_packs : retirer la policy permissive trop large
DROP POLICY IF EXISTS "mandate_packs_select" ON public.mandate_packs;

-- 3) storage.objects : limiter les modérateurs régionaux à leur zone
DROP POLICY IF EXISTS "Authorized users view urgent-cases files" ON storage.objects;

CREATE POLICY "Authorized users view urgent-cases files"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'urgent-cases'
  AND (
    (storage.foldername(name))[1] = (auth.uid())::text
    OR public.has_role(auth.uid(), 'admin'::app_role)
    OR EXISTS (
      SELECT 1
      FROM public.staff_roles sr
      JOIN public.profiles p
        ON p.user_id::text = (storage.foldername(name))[1]
      WHERE sr.user_id = auth.uid()
        AND (
          (sr.role = 'moissonneur_pays'  AND p.country = sr.assigned_country)
          OR (sr.role = 'moissonneur_ville' AND p.country = sr.assigned_country
              AND p.city ILIKE sr.assigned_city)
        )
    )
  )
);
