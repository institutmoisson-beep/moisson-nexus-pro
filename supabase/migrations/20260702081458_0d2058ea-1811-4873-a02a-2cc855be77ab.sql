
DROP POLICY IF EXISTS "Anyone can view active distribution products" ON public.distribution_products;
CREATE POLICY "Authenticated can view active distribution products"
  ON public.distribution_products FOR SELECT TO authenticated
  USING (is_active = true);

DROP POLICY IF EXISTS "Anyone can view active sectors" ON public.pack_sectors;
CREATE POLICY "Authenticated can view active sectors"
  ON public.pack_sectors FOR SELECT TO authenticated
  USING (is_active = true);

DROP POLICY IF EXISTS "Anyone can view active wholesale products" ON public.wholesale_products;
CREATE POLICY "Authenticated can view active wholesale products"
  ON public.wholesale_products FOR SELECT TO authenticated
  USING (is_active = true);

REVOKE SELECT ON public.distribution_products FROM anon;
REVOKE SELECT ON public.pack_sectors FROM anon;
REVOKE SELECT ON public.wholesale_products FROM anon;

DROP POLICY IF EXISTS "mandate_subs_update" ON public.mandate_subscriptions;
CREATE POLICY "mandate_subs_update_admin"
  ON public.mandate_subscriptions FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

REVOKE UPDATE ON public.profiles FROM authenticated;
GRANT UPDATE (
  first_name, last_name, phone, country, avatar_url, address, city, street,
  geolocation, preferred_currency, is_pro_visible,
  id_card_front_url, id_card_back_url, updated_at
) ON public.profiles TO authenticated;

REVOKE SELECT ON public.partner_products FROM anon, authenticated;
GRANT SELECT (
  id, partner_company_id, name, description, price, images, is_active,
  allow_cod, created_at, updated_at, is_digital, stock
) ON public.partner_products TO authenticated;

ALTER TABLE realtime.messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "authenticated_own_topic_select" ON realtime.messages;
DROP POLICY IF EXISTS "authenticated_own_topic_insert" ON realtime.messages;
CREATE POLICY "authenticated_own_topic_select"
  ON realtime.messages FOR SELECT TO authenticated
  USING (
    realtime.topic() = ('user:' || auth.uid()::text)
    OR public.has_role(auth.uid(), 'admin'::app_role)
  );
CREATE POLICY "authenticated_own_topic_insert"
  ON realtime.messages FOR INSERT TO authenticated
  WITH CHECK (
    realtime.topic() = ('user:' || auth.uid()::text)
    OR public.has_role(auth.uid(), 'admin'::app_role)
  );
