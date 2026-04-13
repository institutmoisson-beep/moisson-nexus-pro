
-- Staff roles table
CREATE TABLE public.staff_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);

ALTER TABLE public.staff_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage staff roles" ON public.staff_roles FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can view own staff roles" ON public.staff_roles FOR SELECT USING (auth.uid() = user_id);

-- Add is_mlm_pack to packs
ALTER TABLE public.packs ADD COLUMN is_mlm_pack boolean NOT NULL DEFAULT true;

-- Add transfer and product_purchase to transaction_type enum
ALTER TYPE public.transaction_type ADD VALUE IF NOT EXISTS 'transfer';
ALTER TYPE public.transaction_type ADD VALUE IF NOT EXISTS 'product_purchase';
