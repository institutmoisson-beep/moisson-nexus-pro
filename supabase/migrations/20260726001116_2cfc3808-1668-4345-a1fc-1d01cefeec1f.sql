
-- 1) Update trigger to allow internal bypass via a session flag
CREATE OR REPLACE FUNCTION public.profiles_block_sensitive_self_update()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Internal bypass for SECURITY DEFINER functions (e.g. commission payouts)
  IF current_setting('app.bypass_profile_guard', true) = 'on' THEN
    RETURN NEW;
  END IF;

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
$function$;

-- 2) Update commission processor: allow any authenticated user OR system (cron)
--    and enable the guard bypass for the wallet update.
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
BEGIN
  -- Bypass the profile guard trigger for internal wallet credit
  PERFORM set_config('app.bypass_profile_guard', 'on', true);

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

  -- Reset the guard flag
  PERFORM set_config('app.bypass_profile_guard', 'off', true);

  RETURN v_processed;
END;
$function$;

-- Ensure execute grants (any signed-in user can trigger a payout run; the function is idempotent per due date)
GRANT EXECUTE ON FUNCTION public.process_mandate_commissions() TO authenticated, service_role;
