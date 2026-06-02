
-- Ensure delivery info columns exist
ALTER TABLE public.wholesale_orders
  ADD COLUMN IF NOT EXISTS delivery_city text,
  ADD COLUMN IF NOT EXISTS delivery_address text,
  ADD COLUMN IF NOT EXISTS delivery_phone text,
  ADD COLUMN IF NOT EXISTS notes text;

ALTER TABLE public.distribution_orders
  ADD COLUMN IF NOT EXISTS delivery_city text,
  ADD COLUMN IF NOT EXISTS delivery_address text,
  ADD COLUMN IF NOT EXISTS delivery_phone text;

-- Enable RLS on product tables
ALTER TABLE public.wholesale_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.distribution_products ENABLE ROW LEVEL SECURITY;

-- Public read for active products
DROP POLICY IF EXISTS "Anyone can view active wholesale products" ON public.wholesale_products;
CREATE POLICY "Anyone can view active wholesale products"
  ON public.wholesale_products FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "Admins manage wholesale products" ON public.wholesale_products;
CREATE POLICY "Admins manage wholesale products"
  ON public.wholesale_products FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Anyone can view active distribution products" ON public.distribution_products;
CREATE POLICY "Anyone can view active distribution products"
  ON public.distribution_products FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "Admins manage distribution products" ON public.distribution_products;
CREATE POLICY "Admins manage distribution products"
  ON public.distribution_products FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Admin policies for orders
DROP POLICY IF EXISTS "Admins manage wholesale orders" ON public.wholesale_orders;
CREATE POLICY "Admins manage wholesale orders"
  ON public.wholesale_orders FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins manage distribution orders" ON public.distribution_orders;
CREATE POLICY "Admins manage distribution orders"
  ON public.distribution_orders FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Allow buyers/agents to update their own orders (cancel) and admins
DROP POLICY IF EXISTS "Users update own wholesale orders" ON public.wholesale_orders;
CREATE POLICY "Users update own wholesale orders"
  ON public.wholesale_orders FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users update own distribution orders" ON public.distribution_orders;
CREATE POLICY "Users update own distribution orders"
  ON public.distribution_orders FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
