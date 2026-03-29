
-- ============================================
-- INSTITUT MOISSON MLM SYSTEM - DATABASE SCHEMA
-- ============================================

-- Role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- Career profile enum  
CREATE TYPE public.career_profile AS ENUM (
  'semeur', 'cultivateur', 'moissonneur', 'guide_de_champ', 
  'maitre_moissonneur', 'grand_moissonneur', 'ambassadeur_moisson',
  'stratege_moisson', 'elite_moisson', 'guide_moissonneur'
);

-- Transaction type enum
CREATE TYPE public.transaction_type AS ENUM (
  'deposit', 'withdrawal', 'pack_purchase', 'commission', 
  'bonus', 'admin_credit', 'admin_debit'
);

-- Transaction status enum
CREATE TYPE public.transaction_status AS ENUM ('pending', 'approved', 'rejected');

-- ============================================
-- PROFILES TABLE
-- ============================================
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  country TEXT,
  referral_code TEXT NOT NULL UNIQUE,
  referred_by UUID REFERENCES public.profiles(id),
  wallet_balance NUMERIC(15,2) NOT NULL DEFAULT 0,
  career_level public.career_profile NOT NULL DEFAULT 'semeur',
  is_mlm_active BOOLEAN NOT NULL DEFAULT false,
  is_suspended BOOLEAN NOT NULL DEFAULT false,
  avatar_url TEXT,
  address TEXT,
  city TEXT,
  street TEXT,
  geolocation JSONB,
  preferred_currency TEXT NOT NULL DEFAULT 'XOF',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Anyone can view profiles for referral lookup" ON public.profiles FOR SELECT USING (true);

-- ============================================
-- USER ROLES TABLE
-- ============================================
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  UNIQUE(user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);

-- Security definer function for role checking
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role
  )
$$;

-- Admin policies
CREATE POLICY "Admins can view all profiles" ON public.profiles FOR SELECT 
  USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update all profiles" ON public.profiles FOR UPDATE 
  USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can view all roles" ON public.user_roles FOR SELECT 
  USING (public.has_role(auth.uid(), 'admin'));

-- ============================================
-- PARTNER COMPANIES
-- ============================================
CREATE TABLE public.partner_companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  logo_url TEXT,
  image1_url TEXT,
  image2_url TEXT,
  whatsapp TEXT,
  facebook TEXT,
  website TEXT,
  email TEXT,
  phone TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  partner_since TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.partner_companies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view active partners" ON public.partner_companies FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can manage partners" ON public.partner_companies FOR ALL 
  USING (public.has_role(auth.uid(), 'admin'));

-- ============================================
-- ACTIVATION PACKS
-- ============================================
CREATE TABLE public.packs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  price NUMERIC(15,2) NOT NULL,
  description TEXT,
  physical_prizes TEXT,
  commission_percentage NUMERIC(5,2) NOT NULL DEFAULT 10,
  partner_company_id UUID REFERENCES public.partner_companies(id),
  images TEXT[] DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.packs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view active packs" ON public.packs FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can manage packs" ON public.packs FOR ALL 
  USING (public.has_role(auth.uid(), 'admin'));

-- ============================================
-- PAYMENT METHODS (admin-defined)
-- ============================================
CREATE TABLE public.payment_methods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  details JSONB NOT NULL DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view active payment methods" ON public.payment_methods FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can manage payment methods" ON public.payment_methods FOR ALL 
  USING (public.has_role(auth.uid(), 'admin'));

-- ============================================
-- TRANSACTIONS
-- ============================================
CREATE TABLE public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type public.transaction_type NOT NULL,
  amount NUMERIC(15,2) NOT NULL,
  status public.transaction_status NOT NULL DEFAULT 'pending',
  payment_method_id UUID REFERENCES public.payment_methods(id),
  transaction_contact TEXT,
  transaction_id_external TEXT,
  description TEXT,
  metadata JSONB DEFAULT '{}',
  processed_by UUID REFERENCES auth.users(id),
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own transactions" ON public.transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create deposit/withdrawal requests" ON public.transactions FOR INSERT 
  WITH CHECK (auth.uid() = user_id AND type IN ('deposit', 'withdrawal'));
CREATE POLICY "Admins can view all transactions" ON public.transactions FOR SELECT 
  USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update transactions" ON public.transactions FOR UPDATE 
  USING (public.has_role(auth.uid(), 'admin'));

-- ============================================
-- PACK ORDERS
-- ============================================
CREATE TABLE public.pack_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  pack_id UUID NOT NULL REFERENCES public.packs(id),
  amount_paid NUMERIC(15,2) NOT NULL,
  delivery_address TEXT,
  delivery_country TEXT,
  delivery_city TEXT,
  delivery_street TEXT,
  delivery_phone TEXT,
  geolocation JSONB,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.pack_orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own orders" ON public.pack_orders FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create orders" ON public.pack_orders FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can view all orders" ON public.pack_orders FOR SELECT 
  USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update orders" ON public.pack_orders FOR UPDATE 
  USING (public.has_role(auth.uid(), 'admin'));

-- ============================================
-- COMMISSION LEVELS
-- ============================================
CREATE TABLE public.commission_levels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  level_number INT NOT NULL UNIQUE,
  percentage NUMERIC(5,2) NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.commission_levels ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view commission levels" ON public.commission_levels FOR SELECT USING (true);
CREATE POLICY "Admins can manage commission levels" ON public.commission_levels FOR ALL 
  USING (public.has_role(auth.uid(), 'admin'));

-- ============================================
-- CAREER BONUSES CONFIG
-- ============================================
CREATE TABLE public.career_bonuses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  career_level public.career_profile NOT NULL UNIQUE,
  bonus_amount NUMERIC(15,2) NOT NULL DEFAULT 0,
  monthly_bonus NUMERIC(15,2) NOT NULL DEFAULT 0,
  requirements TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.career_bonuses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view career bonuses" ON public.career_bonuses FOR SELECT USING (true);
CREATE POLICY "Admins can manage career bonuses" ON public.career_bonuses FOR ALL 
  USING (public.has_role(auth.uid(), 'admin'));

-- ============================================
-- MLM CONFIG
-- ============================================
CREATE TABLE public.mlm_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.mlm_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view config" ON public.mlm_config FOR SELECT USING (true);
CREATE POLICY "Admins can manage config" ON public.mlm_config FOR ALL 
  USING (public.has_role(auth.uid(), 'admin'));

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

CREATE OR REPLACE FUNCTION public.generate_referral_code()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  code TEXT;
  exists_already BOOLEAN;
BEGIN
  LOOP
    code := 'MOI-' || upper(substr(md5(random()::text), 1, 6));
    SELECT EXISTS(SELECT 1 FROM public.profiles WHERE referral_code = code) INTO exists_already;
    EXIT WHEN NOT exists_already;
  END LOOP;
  RETURN code;
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, first_name, last_name, email, referral_code)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
    NEW.email,
    public.generate_referral_code()
  );
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user');
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_partners_updated_at BEFORE UPDATE ON public.partner_companies
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_packs_updated_at BEFORE UPDATE ON public.packs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default career bonuses
INSERT INTO public.career_bonuses (career_level, bonus_amount, monthly_bonus, requirements) VALUES
  ('semeur', 0, 0, 'Inscription + achat d''un pack'),
  ('cultivateur', 5000, 0, '5 directs MLM niveau 3'),
  ('moissonneur', 25000, 0, '20 directs + volume MLM niveau 5'),
  ('guide_de_champ', 100000, 50000, '3 leaders Niveau 5 + bonus mensuel'),
  ('maitre_moissonneur', 250000, 100000, '3 Guides de Champ + bonus mensuel'),
  ('grand_moissonneur', 500000, 200000, 'Réseau international + revenus passifs'),
  ('ambassadeur_moisson', 1000000, 350000, '5 Grands Moissonneurs actifs'),
  ('stratege_moisson', 2000000, 500000, 'Réseau multi-pays + volume exceptionnel'),
  ('elite_moisson', 5000000, 1000000, 'Top 1% du réseau mondial'),
  ('guide_moissonneur', 10000000, 2000000, 'Rang suprême + héritage de réseau');

INSERT INTO public.commission_levels (level_number, percentage, description) VALUES
  (1, 10, 'Direct - Niveau 1'),
  (2, 5, 'Niveau 2'),
  (3, 3, 'Niveau 3'),
  (4, 2, 'Niveau 4'),
  (5, 1.5, 'Niveau 5'),
  (6, 1, 'Niveau 6'),
  (7, 0.75, 'Niveau 7'),
  (8, 0.5, 'Niveau 8'),
  (9, 0.25, 'Niveau 9'),
  (10, 0.1, 'Niveau 10+');
