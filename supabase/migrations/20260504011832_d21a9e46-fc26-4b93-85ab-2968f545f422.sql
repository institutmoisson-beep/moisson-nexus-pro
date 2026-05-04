ALTER TABLE public.partner_products
  ADD COLUMN IF NOT EXISTS is_digital boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS digital_content text,
  ADD COLUMN IF NOT EXISTS stock integer;

CREATE TABLE IF NOT EXISTS public.product_purchases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  product_id uuid NOT NULL,
  partner_company_id uuid NOT NULL,
  product_name text NOT NULL,
  amount_paid numeric NOT NULL,
  is_digital boolean NOT NULL DEFAULT false,
  digital_content text,
  delivery_address text,
  delivery_city text,
  delivery_country text,
  delivery_phone text,
  status text NOT NULL DEFAULT 'completed',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.product_purchases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own purchases" ON public.product_purchases
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users create own purchases" ON public.product_purchases
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins view all purchases" ON public.product_purchases
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

CREATE OR REPLACE FUNCTION public.purchase_partner_product(
  _product_id uuid,
  _delivery jsonb DEFAULT '{}'::jsonb
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_user uuid := auth.uid();
  v_product partner_products%ROWTYPE;
  v_balance numeric;
  v_purchase_id uuid;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'Non authentifié'; END IF;

  SELECT * INTO v_product FROM partner_products WHERE id = _product_id AND is_active = true;
  IF NOT FOUND THEN RAISE EXCEPTION 'Produit introuvable'; END IF;

  IF v_product.stock IS NOT NULL AND v_product.stock <= 0 THEN
    RAISE EXCEPTION 'Produit en rupture de stock';
  END IF;

  SELECT wallet_balance INTO v_balance FROM profiles WHERE user_id = v_user FOR UPDATE;
  IF v_balance < v_product.price THEN RAISE EXCEPTION 'Solde insuffisant'; END IF;

  UPDATE profiles SET wallet_balance = wallet_balance - v_product.price WHERE user_id = v_user;

  IF v_product.stock IS NOT NULL THEN
    UPDATE partner_products SET stock = stock - 1 WHERE id = _product_id;
  END IF;

  INSERT INTO product_purchases (
    user_id, product_id, partner_company_id, product_name, amount_paid,
    is_digital, digital_content,
    delivery_address, delivery_city, delivery_country, delivery_phone,
    status
  ) VALUES (
    v_user, v_product.id, v_product.partner_company_id, v_product.name, v_product.price,
    v_product.is_digital,
    CASE WHEN v_product.is_digital THEN v_product.digital_content ELSE NULL END,
    _delivery->>'address', _delivery->>'city', _delivery->>'country', _delivery->>'phone',
    CASE WHEN v_product.is_digital THEN 'delivered' ELSE 'pending_delivery' END
  ) RETURNING id INTO v_purchase_id;

  INSERT INTO transactions (user_id, amount, type, status, description, processed_at, metadata)
  VALUES (v_user, v_product.price, 'product_purchase', 'approved',
    'Achat produit: ' || v_product.name, now(),
    jsonb_build_object('product_id', v_product.id, 'purchase_id', v_purchase_id, 'is_digital', v_product.is_digital));

  RETURN jsonb_build_object(
    'success', true,
    'purchase_id', v_purchase_id,
    'is_digital', v_product.is_digital,
    'digital_content', CASE WHEN v_product.is_digital THEN v_product.digital_content ELSE NULL END
  );
END;
$$;