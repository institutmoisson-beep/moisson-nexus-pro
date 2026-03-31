
-- Create pack sectors table
CREATE TABLE public.pack_sectors (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.pack_sectors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage sectors" ON public.pack_sectors FOR ALL USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Anyone can view active sectors" ON public.pack_sectors FOR SELECT USING (is_active = true);

-- Add sector_id to packs
ALTER TABLE public.packs ADD COLUMN sector_id UUID REFERENCES public.pack_sectors(id);

-- Add is_pro_visible to profiles for Moissonneurs Pros directory
ALTER TABLE public.profiles ADD COLUMN is_pro_visible BOOLEAN NOT NULL DEFAULT false;

-- Add payment_link to payment_methods details (already jsonb, no schema change needed)
-- But let's add a dedicated column for clickable link
ALTER TABLE public.payment_methods ADD COLUMN payment_link TEXT;
