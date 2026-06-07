
-- 1) partner_companies: restrict to authenticated
DROP POLICY IF EXISTS "Anyone can view active partners" ON public.partner_companies;
CREATE POLICY "Authenticated can view active partners"
ON public.partner_companies FOR SELECT
TO authenticated
USING (is_active = true);
REVOKE SELECT ON public.partner_companies FROM anon;

-- 2) partner_products: hide digital_content from generic listing
DROP POLICY IF EXISTS "Anyone can view active products" ON public.partner_products;
CREATE POLICY "Authenticated can view active products"
ON public.partner_products FOR SELECT
TO authenticated
USING (is_active = true);
REVOKE SELECT ON public.partner_products FROM anon;

-- Create a public-safe view excluding digital_content for browsing
CREATE OR REPLACE VIEW public.partner_products_public AS
SELECT id, partner_company_id, name, description, price, images,
       is_active, allow_cod, is_digital, stock, created_at, updated_at
FROM public.partner_products
WHERE is_active = true;
GRANT SELECT ON public.partner_products_public TO anon, authenticated;

-- 3) payment_methods: restrict to authenticated
DROP POLICY IF EXISTS "Anyone can view active payment methods" ON public.payment_methods;
CREATE POLICY "Authenticated can view active payment methods"
ON public.payment_methods FOR SELECT
TO authenticated
USING (is_active = true);
REVOKE SELECT ON public.payment_methods FROM anon;

-- 4) fund_transactions: remove from realtime publication
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'fund_transactions'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime DROP TABLE public.fund_transactions';
  END IF;
END $$;

-- 5) msn_coins: explicit deny for user inserts (only admins / SECURITY DEFINER functions)
-- No permissive INSERT policy for users = inserts blocked. Add restrictive policy to be explicit.
CREATE POLICY "Block direct user inserts on msn_coins"
ON public.msn_coins AS RESTRICTIVE FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
