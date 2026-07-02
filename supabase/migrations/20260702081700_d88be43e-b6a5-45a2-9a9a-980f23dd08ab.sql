
-- 1. Restrict catalogs to authenticated
DROP POLICY IF EXISTS "Anyone can view career bonuses" ON public.career_bonuses;
CREATE POLICY "Authenticated can view career bonuses"
  ON public.career_bonuses FOR SELECT TO authenticated USING (true);
REVOKE SELECT ON public.career_bonuses FROM anon;

DROP POLICY IF EXISTS "Anyone can view commission levels" ON public.commission_levels;
CREATE POLICY "Authenticated can view commission levels"
  ON public.commission_levels FOR SELECT TO authenticated USING (true);
REVOKE SELECT ON public.commission_levels FROM anon;

DROP POLICY IF EXISTS "Anyone can view active mandate packs" ON public.mandate_packs;
CREATE POLICY "Authenticated can view active mandate packs"
  ON public.mandate_packs FOR SELECT TO authenticated USING (is_active = true);
REVOKE SELECT ON public.mandate_packs FROM anon;

DROP POLICY IF EXISTS "Anyone can view config" ON public.mlm_config;
CREATE POLICY "Authenticated can view mlm config"
  ON public.mlm_config FOR SELECT TO authenticated USING (true);
REVOKE SELECT ON public.mlm_config FROM anon;

DROP POLICY IF EXISTS "Anyone can view msn config" ON public.msn_config;
CREATE POLICY "Authenticated can view msn config"
  ON public.msn_config FOR SELECT TO authenticated USING (true);
REVOKE SELECT ON public.msn_config FROM anon;

DROP POLICY IF EXISTS "Anyone can view active packs" ON public.packs;
CREATE POLICY "Authenticated can view active packs"
  ON public.packs FOR SELECT TO authenticated USING (is_active = true);
REVOKE SELECT ON public.packs FROM anon;

-- 2. Profiles: column-level UPDATE restriction (safe fields only)
REVOKE UPDATE ON public.profiles FROM authenticated, anon;
GRANT UPDATE (
  first_name, last_name, phone, country, avatar_url, address, city, street,
  geolocation, preferred_currency, is_pro_visible,
  id_card_front_url, id_card_back_url, updated_at
) ON public.profiles TO authenticated;

-- 3. Partner products: hide digital_content from general SELECT
REVOKE SELECT ON public.partner_products FROM anon, authenticated;
GRANT SELECT (
  id, partner_company_id, name, description, price, images, is_active,
  allow_cod, created_at, updated_at, is_digital, stock
) ON public.partner_products TO authenticated;

-- 4. Storage: admin UPDATE policy for urgent-cases
DROP POLICY IF EXISTS "Admin update urgent-cases image" ON storage.objects;
CREATE POLICY "Admin update urgent-cases image"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'urgent-cases'
    AND (
      public.has_role(auth.uid(), 'admin'::public.app_role)
      OR EXISTS (
        SELECT 1 FROM public.staff_roles sr
        JOIN public.profiles p ON p.user_id::text = (storage.foldername(storage.objects.name))[1]
        WHERE sr.user_id = auth.uid()
          AND (
            (sr.role = 'moissonneur_pays' AND p.country = sr.assigned_country)
            OR (sr.role = 'moissonneur_ville' AND p.country = sr.assigned_country AND p.city ILIKE sr.assigned_city)
          )
      )
    )
  )
  WITH CHECK (
    bucket_id = 'urgent-cases'
    AND public.has_role(auth.uid(), 'admin'::public.app_role)
  );
