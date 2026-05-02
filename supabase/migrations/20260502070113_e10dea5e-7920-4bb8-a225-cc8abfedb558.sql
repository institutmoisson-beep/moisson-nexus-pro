
-- Vues : SECURITY INVOKER
ALTER VIEW IF EXISTS public.regional_staff_view SET (security_invoker = true);
ALTER VIEW IF EXISTS public.business_agent_leaderboard SET (security_invoker = true);

-- Restreindre exécution aux authenticated only
REVOKE EXECUTE ON FUNCTION public.award_msn_coins(uuid, uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.can_access_urgent_case(uuid, uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.distribute_commissions(uuid, uuid, text, numeric) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.distribute_commissions(uuid, uuid, numeric, text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.process_mandate_commissions() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.award_msn_coins(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_access_urgent_case(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.distribute_commissions(uuid, uuid, text, numeric) TO authenticated;
GRANT EXECUTE ON FUNCTION public.distribute_commissions(uuid, uuid, numeric, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.process_mandate_commissions() TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated;
