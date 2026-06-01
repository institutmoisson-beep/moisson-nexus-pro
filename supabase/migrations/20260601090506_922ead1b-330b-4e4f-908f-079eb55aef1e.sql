-- Fix distribute_mlm_commissions: column/value count mismatch + add paid_at
CREATE OR REPLACE FUNCTION public.distribute_mlm_commissions(p_purchaser_id uuid, p_pack_id uuid, p_order_id uuid)
 RETURNS TABLE(level integer, recipient_id uuid, amount numeric, status text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_pack RECORD;
  v_commission RECORD;
  v_sponsor_id UUID;
  v_sponsor_user_id UUID;
BEGIN
  SELECT * INTO v_pack FROM packs WHERE id = p_pack_id;
  IF NOT FOUND THEN RETURN; END IF;

  -- Skip if pack has no benefit configured
  IF COALESCE(v_pack.benefit, 0) <= 0 OR COALESCE(v_pack.level1_commission_percent, 0) <= 0 THEN
    RETURN;
  END IF;

  FOR v_commission IN
    SELECT * FROM calculate_pack_commissions(
      v_pack.benefit,
      v_pack.level1_commission_percent,
      COALESCE(v_pack.decay_factor, 0.5),
      COALESCE(v_pack.min_commission, 10)
    )
  LOOP
    v_sponsor_id := get_sponsor_at_level(p_purchaser_id, v_commission.level);
    EXIT WHEN v_sponsor_id IS NULL;

    -- Resolve auth user_id from profile id, and skip suspended/inactive sponsors
    SELECT user_id INTO v_sponsor_user_id
      FROM profiles
     WHERE id = v_sponsor_id
       AND is_mlm_active = true
       AND COALESCE(is_suspended, false) = false;

    IF v_sponsor_user_id IS NULL THEN
      CONTINUE;
    END IF;

    INSERT INTO commissions (
      user_id, amount, type, source_id, source_name, source_table, level, status, paid_at, created_at
    ) VALUES (
      v_sponsor_user_id,
      v_commission.amount,
      'direct',
      p_order_id,
      v_pack.name,
      'pack_orders',
      v_commission.level,
      'paid',
      now(),
      now()
    );

    UPDATE profiles
       SET wallet_balance = COALESCE(wallet_balance, 0) + v_commission.amount
     WHERE id = v_sponsor_id;

    INSERT INTO transactions (
      user_id, amount, type, status, description, metadata, processed_at
    ) VALUES (
      v_sponsor_user_id,
      v_commission.amount,
      'commission',
      'approved',
      'Commission MLM Niveau ' || v_commission.level || ' — ' || v_pack.name,
      jsonb_build_object(
        'pack_id', p_pack_id,
        'order_id', p_order_id,
        'level', v_commission.level,
        'percentage', v_commission.percentage,
        'benefit', v_pack.benefit
      ),
      now()
    );

    level := v_commission.level;
    recipient_id := v_sponsor_id;
    amount := v_commission.amount;
    status := 'paid';
    RETURN NEXT;
  END LOOP;
END;
$function$;