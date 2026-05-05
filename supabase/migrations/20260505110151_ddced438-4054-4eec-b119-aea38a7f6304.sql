-- Add review columns to product_purchases and pack_orders, and admin update policy
ALTER TABLE public.product_purchases
  ADD COLUMN IF NOT EXISTS user_note text,
  ADD COLUMN IF NOT EXISTS user_rating integer,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

ALTER TABLE public.pack_orders
  ADD COLUMN IF NOT EXISTS user_note text,
  ADD COLUMN IF NOT EXISTS user_rating integer;

-- Allow admins to update product_purchases (status, etc.) and users to update their own (rating/note)
DROP POLICY IF EXISTS "Admins update product purchases" ON public.product_purchases;
CREATE POLICY "Admins update product purchases"
  ON public.product_purchases FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Users update own purchase rating" ON public.product_purchases;
CREATE POLICY "Users update own purchase rating"
  ON public.product_purchases FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Allow users to update own pack_orders (for rating)
DROP POLICY IF EXISTS "Users update own pack order rating" ON public.pack_orders;
CREATE POLICY "Users update own pack order rating"
  ON public.pack_orders FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);