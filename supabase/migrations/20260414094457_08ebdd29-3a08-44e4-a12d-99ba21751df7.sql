
-- MSN Coins tracking
CREATE TABLE public.msn_coins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  coins integer NOT NULL DEFAULT 1,
  source_type text NOT NULL DEFAULT 'network_sale',
  source_user_id uuid,
  source_order_id uuid,
  is_converted boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.msn_coins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own coins" ON public.msn_coins FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all coins" ON public.msn_coins FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can manage coins" ON public.msn_coins FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- MSN Coin conversions
CREATE TABLE public.msn_conversions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  coins_used integer NOT NULL,
  dollar_amount numeric NOT NULL,
  status text NOT NULL DEFAULT 'completed',
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.msn_conversions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own conversions" ON public.msn_conversions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create conversions" ON public.msn_conversions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can manage conversions" ON public.msn_conversions FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- MSN Plan config (conversion tiers, matching bonus levels, strong leg %, revenue caps)
CREATE TABLE public.msn_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE,
  value jsonb NOT NULL,
  label text,
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.msn_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view msn config" ON public.msn_config FOR SELECT USING (true);
CREATE POLICY "Admins can manage msn config" ON public.msn_config FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Insert default config
INSERT INTO public.msn_config (key, value, label) VALUES
  ('conversion_tiers', '[{"coins":3,"dollars":40},{"coins":6,"dollars":125},{"coins":12,"dollars":250}]', 'Paliers de conversion MSN Coins'),
  ('max_coins_convert', '12', 'Maximum de coins convertibles'),
  ('matching_bonus_levels', '[{"level":1,"percentage":10},{"level":2,"percentage":9},{"level":3,"percentage":8},{"level":4,"percentage":7},{"level":5,"percentage":6},{"level":6,"percentage":5},{"level":7,"percentage":4},{"level":8,"percentage":3},{"level":9,"percentage":2},{"level":10,"percentage":1}]', 'Matching Bonus par niveau'),
  ('strong_leg_bonus_pct', '5', 'Pourcentage Strong Leg Bonus'),
  ('revenue_caps', '[{"career":"semeur","min":100,"max":500},{"career":"cultivateur","min":500,"max":1000},{"career":"moissonneur","min":1000,"max":5000},{"career":"guide_de_champ","min":5000,"max":10000},{"career":"maitre_moissonneur","min":10000,"max":25000}]', 'Plafonds de revenus par carrière');

-- Function to award MSN coins on network sale
CREATE OR REPLACE FUNCTION public.award_msn_coins(_buyer_user_id uuid, _order_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_current public.profiles%ROWTYPE;
  v_sponsor public.profiles%ROWTYPE;
  v_level integer := 0;
BEGIN
  SELECT * INTO v_current FROM public.profiles WHERE user_id = _buyer_user_id;
  IF v_current IS NULL THEN RETURN; END IF;

  WHILE v_current.referred_by IS NOT NULL AND v_level < 20 LOOP
    v_level := v_level + 1;
    SELECT * INTO v_sponsor FROM public.profiles WHERE id = v_current.referred_by;
    IF v_sponsor IS NULL THEN EXIT; END IF;

    IF v_sponsor.is_mlm_active THEN
      INSERT INTO public.msn_coins (user_id, coins, source_type, source_user_id, source_order_id)
      VALUES (v_sponsor.user_id, 1, 'network_sale', _buyer_user_id, _order_id);
    END IF;

    v_current := v_sponsor;
  END LOOP;
END;
$$;
