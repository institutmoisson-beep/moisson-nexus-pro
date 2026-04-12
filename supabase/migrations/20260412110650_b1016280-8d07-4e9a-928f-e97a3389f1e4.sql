
CREATE TABLE public.pack_commissions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  pack_id uuid NOT NULL REFERENCES public.packs(id) ON DELETE CASCADE,
  level_number integer NOT NULL,
  percentage numeric NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(pack_id, level_number)
);

ALTER TABLE public.pack_commissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage pack commissions"
ON public.pack_commissions FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Anyone can view pack commissions"
ON public.pack_commissions FOR SELECT
USING (true);
