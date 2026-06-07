
-- 1. msn_coins: remove user UPDATE (mutations should go through RPC/admin only)
DROP POLICY IF EXISTS "Users can update own coins" ON public.msn_coins;

-- 2. profiles: replace permissive regional moderator UPDATE with a security-definer RPC limited to suspension
DROP POLICY IF EXISTS "Regional moderators can update profile suspension" ON public.profiles;

CREATE OR REPLACE FUNCTION public.regional_set_suspension(_target_user_id uuid, _suspend boolean, _reason text DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_actor uuid := auth.uid();
  v_target public.profiles%ROWTYPE;
  v_authorized boolean := false;
BEGIN
  IF v_actor IS NULL THEN RAISE EXCEPTION 'Non authentifié'; END IF;

  SELECT * INTO v_target FROM public.profiles WHERE user_id = _target_user_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Profil introuvable'; END IF;

  IF has_role(v_actor, 'admin'::app_role) THEN
    v_authorized := true;
  ELSE
    SELECT EXISTS (
      SELECT 1 FROM public.staff_roles sr
      WHERE sr.user_id = v_actor
        AND (
          (sr.role = 'moissonneur_pays' AND v_target.country = sr.assigned_country)
          OR (sr.role = 'moissonneur_ville' AND v_target.country = sr.assigned_country
              AND v_target.city ILIKE sr.assigned_city)
        )
    ) INTO v_authorized;
  END IF;

  IF NOT v_authorized THEN
    RAISE EXCEPTION 'Action réservée aux modérateurs régionaux compétents';
  END IF;

  UPDATE public.profiles
     SET is_suspended = _suspend,
         updated_at = now()
   WHERE user_id = _target_user_id;

  INSERT INTO public.regional_moderation_log
    (moderator_id, moderator_user_id, moderator_role, target_user_id, action, scope, scope_value, reason, motif)
  VALUES (
    v_actor, v_actor,
    CASE WHEN has_role(v_actor, 'admin'::app_role) THEN 'admin' ELSE 'regional' END,
    _target_user_id,
    CASE WHEN _suspend THEN 'suspend' ELSE 'reactivate' END,
    'country', COALESCE(v_target.country, ''), _reason, _reason
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.regional_set_suspension(uuid, boolean, text) TO authenticated;

-- 3. partner_products: hide digital_content column from clients via column-level grants
REVOKE SELECT ON public.partner_products FROM authenticated, anon;
GRANT SELECT (
  id, partner_company_id, name, description, price, images,
  is_active, allow_cod, is_digital, stock, created_at, updated_at
) ON public.partner_products TO authenticated, anon;

-- Admin RPC to fetch full product (including digital_content) for the admin UI
CREATE OR REPLACE FUNCTION public.admin_get_partner_product(_id uuid)
RETURNS public.partner_products
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE r public.partner_products%ROWTYPE;
BEGIN
  IF NOT has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Réservé aux administrateurs';
  END IF;
  SELECT * INTO r FROM public.partner_products WHERE id = _id;
  RETURN r;
END;
$$;
GRANT EXECUTE ON FUNCTION public.admin_get_partner_product(uuid) TO authenticated;

-- 4. urgent-cases storage: remove the public read policy (bucket flipped to private separately)
DROP POLICY IF EXISTS "Public read urgent-cases images" ON storage.objects;
