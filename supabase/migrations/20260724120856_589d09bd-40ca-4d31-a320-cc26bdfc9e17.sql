
-- Enforce admin check inside + allow authenticated to call (function checks role itself)
CREATE OR REPLACE FUNCTION public.process_mandate_commissions()
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_sub   RECORD;
  v_commission NUMERIC;
  v_processed  INTEGER := 0;
  v_periods    INTEGER;
  v_total      NUMERIC;
  v_caller uuid := auth.uid();
BEGIN
  -- Autoriser uniquement les admins ou l'appel système (service_role => auth.uid() IS NULL)
  IF v_caller IS NOT NULL AND NOT public.has_role(v_caller, 'admin'::app_role) THEN
    RAISE EXCEPTION 'Réservé aux administrateurs';
  END IF;

  FOR v_sub IN
    SELECT
      ms.id, ms.user_id, ms.mandate_pack_id, ms.next_commission_date,
      ms.total_commissions_paid, ms.end_date,
      mp.commission_every_3_days, mp.name AS pack_name
    FROM mandate_subscriptions ms
    JOIN mandate_packs mp ON mp.id = ms.mandate_pack_id
    WHERE ms.status = 'active'
      AND ms.end_date > now()
      AND ms.next_commission_date <= now()
  LOOP
    v_commission := v_sub.commission_every_3_days;
    v_periods := GREATEST(
      1,
      FLOOR(EXTRACT(EPOCH FROM (now() - v_sub.next_commission_date)) / (3 * 24 * 3600))::INTEGER + 1
    );
    v_total := v_commission * v_periods;

    UPDATE public.profiles
    SET wallet_balance = COALESCE(wallet_balance,0) + v_total
    WHERE user_id = v_sub.user_id;

    INSERT INTO public.transactions (
      user_id, amount, type, status, description, processed_at, metadata
    ) VALUES (
      v_sub.user_id, v_total, 'commission', 'approved',
      'Commission Mandat de Vente — ' || v_sub.pack_name ||
        CASE WHEN v_periods > 1 THEN ' (' || v_periods || ' périodes rattrapées)' ELSE '' END,
      now(),
      jsonb_build_object(
        'subscription_id', v_sub.id,
        'mandate_pack_id', v_sub.mandate_pack_id,
        'commission_per_period', v_commission,
        'periods', v_periods
      )
    );

    UPDATE public.mandate_subscriptions
    SET total_commissions_paid = total_commissions_paid + v_total,
        next_commission_date   = next_commission_date + (v_periods * INTERVAL '3 days'),
        last_commission_date   = now()
    WHERE id = v_sub.id;

    v_processed := v_processed + 1;
  END LOOP;

  UPDATE public.mandate_subscriptions
  SET status = 'completed'
  WHERE status = 'active' AND end_date <= now();

  RETURN v_processed;
END;
$function$;

GRANT EXECUTE ON FUNCTION public.process_mandate_commissions() TO authenticated, service_role;

-- Activer pg_cron et pg_net pour l'automatisation
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Planifier l'exécution automatique toutes les heures
DO $$
BEGIN
  PERFORM cron.unschedule('process-mandate-commissions-hourly');
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

SELECT cron.schedule(
  'process-mandate-commissions-hourly',
  '0 * * * *',
  $$ SELECT public.process_mandate_commissions(); $$
);
