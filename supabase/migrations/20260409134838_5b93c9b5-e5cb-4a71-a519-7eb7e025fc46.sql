
-- Storage bucket for images
INSERT INTO storage.buckets (id, name, public) VALUES ('images', 'images', true);

-- Storage policies
CREATE POLICY "Public read access" ON storage.objects FOR SELECT USING (bucket_id = 'images');
CREATE POLICY "Authenticated users can upload" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'images' AND auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can update own" ON storage.objects FOR UPDATE USING (bucket_id = 'images' AND auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can delete own" ON storage.objects FOR DELETE USING (bucket_id = 'images' AND auth.role() = 'authenticated');

-- Partner products table
CREATE TABLE public.partner_products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  partner_company_id UUID NOT NULL REFERENCES public.partner_companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC NOT NULL DEFAULT 0,
  images TEXT[] DEFAULT '{}'::TEXT[],
  is_active BOOLEAN NOT NULL DEFAULT true,
  allow_cod BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.partner_products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active products" ON public.partner_products FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can manage products" ON public.partner_products FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_partner_products_updated_at BEFORE UPDATE ON public.partner_products
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
