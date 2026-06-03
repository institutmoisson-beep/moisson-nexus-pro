
-- ============ profiles: drop public select policy ============
DROP POLICY IF EXISTS "Anyone can view profiles for referral lookup" ON public.profiles;

-- Safe referral lookup (anon + authenticated). Returns only the profile id.
CREATE OR REPLACE FUNCTION public.lookup_referral_code(_code text)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM public.profiles WHERE referral_code = upper(trim(_code)) LIMIT 1;
$$;
REVOKE ALL ON FUNCTION public.lookup_referral_code(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.lookup_referral_code(text) TO anon, authenticated;

-- ============ commissions: enable RLS ============
ALTER TABLE public.commissions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "commissions_select_own" ON public.commissions;
DROP POLICY IF EXISTS "commissions_admin_all" ON public.commissions;
CREATE POLICY "commissions_select_own" ON public.commissions
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "commissions_admin_all" ON public.commissions
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- ============ mlm_nodes: enable RLS ============
ALTER TABLE public.mlm_nodes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "mlm_nodes_select_own" ON public.mlm_nodes;
DROP POLICY IF EXISTS "mlm_nodes_admin_all" ON public.mlm_nodes;
CREATE POLICY "mlm_nodes_select_own" ON public.mlm_nodes
  FOR SELECT TO authenticated
  USING (
    profile_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
    OR public.has_role(auth.uid(), 'admin'::app_role)
  );
CREATE POLICY "mlm_nodes_admin_all" ON public.mlm_nodes
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- ============ fund_transactions: restrict read ============
DROP POLICY IF EXISTS "Anyone authenticated can view fund history" ON public.fund_transactions;
DROP POLICY IF EXISTS "fund_tx_select_own_or_admin" ON public.fund_transactions;
CREATE POLICY "fund_tx_select_own_or_admin" ON public.fund_transactions
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'::app_role));

-- ============ mandate_subscriptions: drop permissive update ============
DROP POLICY IF EXISTS "System can update subscriptions" ON public.mandate_subscriptions;

-- ============ storage.objects: ownership-checked update/delete on images ============
DROP POLICY IF EXISTS "Authenticated users can delete own" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update own" ON storage.objects;
CREATE POLICY "Users can delete own images"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'images'
    AND (
      (storage.foldername(name))[1] = auth.uid()::text
      OR public.has_role(auth.uid(), 'admin'::app_role)
    )
  );
CREATE POLICY "Users can update own images"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'images'
    AND (
      (storage.foldername(name))[1] = auth.uid()::text
      OR public.has_role(auth.uid(), 'admin'::app_role)
    )
  );

-- ============ Set search_path on functions missing it ============
ALTER FUNCTION public.calculate_pack_commissions(numeric,numeric,numeric,numeric) SET search_path = public;
ALTER FUNCTION public.get_sponsor_at_level(uuid,integer) SET search_path = public;
ALTER FUNCTION public.update_mlm_nodes_updated_at() SET search_path = public;
ALTER FUNCTION public.distribute_binary_pv(uuid,numeric) SET search_path = public;
ALTER FUNCTION public.check_binary_pairs(uuid) SET search_path = public;
ALTER FUNCTION public.distribute_matching_bonus(uuid,numeric) SET search_path = public;
ALTER FUNCTION public.process_pack_purchase(uuid,uuid) SET search_path = public;
ALTER FUNCTION public.get_user_network(uuid) SET search_path = public;
ALTER FUNCTION public.create_mlm_node_on_profile() SET search_path = public;
ALTER FUNCTION public.trg_fn_wholesale_orders_status_change() SET search_path = public;

-- ============ Revoke EXECUTE on internal SECURITY DEFINER functions ============
-- These are called by triggers / other functions only; never by clients.
REVOKE EXECUTE ON FUNCTION public.distribute_commissions(uuid,uuid,numeric,text) FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.distribute_commissions(uuid,uuid,text,numeric) FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.distribute_mlm_commissions(uuid,uuid,uuid) FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.distribute_binary_pv(uuid,numeric) FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.distribute_matching_bonus(uuid,numeric) FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.check_binary_pairs(uuid) FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.award_msn_coins(uuid,uuid) FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.process_mandate_commissions() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.process_pack_purchase(uuid,uuid) FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.calculate_pack_commissions(numeric,numeric,numeric,numeric) FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_sponsor_at_level(uuid,integer) FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.create_mlm_node_on_profile() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.trg_fn_wholesale_orders_status_change() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.update_mlm_nodes_updated_at() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.set_updated_at() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.generate_referral_code() FROM anon, authenticated, PUBLIC;
