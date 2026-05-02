
CREATE TABLE IF NOT EXISTS public.community_fund (
  id integer PRIMARY KEY DEFAULT 1,
  balance numeric NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT single_row CHECK (id = 1)
);

INSERT INTO public.community_fund (id, balance) VALUES (1, 0)
  ON CONFLICT (id) DO NOTHING;

ALTER TABLE public.community_fund ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can view fund balance"
  ON public.community_fund FOR SELECT
  TO authenticated
  USING (true);

CREATE TABLE IF NOT EXISTS public.fund_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  type text NOT NULL CHECK (type IN ('contribution', 'withdrawal')),
  amount numeric NOT NULL CHECK (amount > 0),
  reason text,
  balance_after numeric NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_fund_transactions_created_at ON public.fund_transactions (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_fund_transactions_user ON public.fund_transactions (user_id, created_at DESC);

ALTER TABLE public.fund_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can view fund history"
  ON public.fund_transactions FOR SELECT
  TO authenticated
  USING (true);

ALTER PUBLICATION supabase_realtime ADD TABLE public.community_fund;
ALTER PUBLICATION supabase_realtime ADD TABLE public.fund_transactions;

CREATE OR REPLACE FUNCTION public.contribute_to_fund(_amount numeric)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_balance numeric;
  v_new_fund numeric;
BEGIN
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'Non authentifié'; END IF;
  IF _amount IS NULL OR _amount <= 0 THEN RAISE EXCEPTION 'Montant invalide'; END IF;

  SELECT wallet_balance INTO v_balance FROM profiles WHERE user_id = v_user_id FOR UPDATE;
  IF v_balance IS NULL THEN RAISE EXCEPTION 'Profil introuvable'; END IF;
  IF v_balance < _amount THEN RAISE EXCEPTION 'Solde insuffisant'; END IF;

  UPDATE profiles SET wallet_balance = wallet_balance - _amount WHERE user_id = v_user_id;

  UPDATE community_fund SET balance = balance + _amount, updated_at = now()
    WHERE id = 1 RETURNING balance INTO v_new_fund;

  INSERT INTO fund_transactions (user_id, type, amount, balance_after)
    VALUES (v_user_id, 'contribution', _amount, v_new_fund);

  INSERT INTO transactions (user_id, amount, type, status, description, processed_at)
    VALUES (v_user_id, _amount, 'fund_contribution', 'approved',
            'Cotisation au fond communautaire', now());

  RETURN jsonb_build_object('success', true, 'new_fund_balance', v_new_fund);
END;
$$;

REVOKE EXECUTE ON FUNCTION public.contribute_to_fund(numeric) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.contribute_to_fund(numeric) TO authenticated;

CREATE OR REPLACE FUNCTION public.admin_withdraw_from_fund(_amount numeric, _reason text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_fund numeric;
  v_new_fund numeric;
BEGIN
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'Non authentifié'; END IF;
  IF NOT has_role(v_user_id, 'admin'::app_role) THEN RAISE EXCEPTION 'Réservé aux administrateurs'; END IF;
  IF _amount IS NULL OR _amount <= 0 THEN RAISE EXCEPTION 'Montant invalide'; END IF;
  IF _reason IS NULL OR length(trim(_reason)) < 3 THEN RAISE EXCEPTION 'Motif obligatoire'; END IF;

  SELECT balance INTO v_fund FROM community_fund WHERE id = 1 FOR UPDATE;
  IF v_fund < _amount THEN RAISE EXCEPTION 'Solde du fond insuffisant'; END IF;

  UPDATE community_fund SET balance = balance - _amount, updated_at = now()
    WHERE id = 1 RETURNING balance INTO v_new_fund;

  INSERT INTO fund_transactions (user_id, type, amount, reason, balance_after)
    VALUES (v_user_id, 'withdrawal', _amount, trim(_reason), v_new_fund);

  RETURN jsonb_build_object('success', true, 'new_fund_balance', v_new_fund);
END;
$$;

REVOKE EXECUTE ON FUNCTION public.admin_withdraw_from_fund(numeric, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_withdraw_from_fund(numeric, text) TO authenticated;

ALTER FUNCTION public.set_updated_at() SET search_path = public;
ALTER FUNCTION public.update_updated_at_column() SET search_path = public;

DROP POLICY IF EXISTS "Public can view urgent-cases images" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view urgent-cases" ON storage.objects;
DROP POLICY IF EXISTS "Public read urgent-cases" ON storage.objects;

CREATE POLICY "Authorized users view urgent-cases files"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'urgent-cases'
    AND (
      (storage.foldername(name))[1] = auth.uid()::text
      OR has_role(auth.uid(), 'admin'::app_role)
      OR EXISTS (
        SELECT 1 FROM staff_roles sr
        WHERE sr.user_id = auth.uid()
          AND sr.role IN ('moissonneur_pays','moissonneur_ville')
      )
    )
  );

DROP POLICY IF EXISTS "Users upload to urgent-cases" ON storage.objects;
CREATE POLICY "Users upload to urgent-cases"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'urgent-cases'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
