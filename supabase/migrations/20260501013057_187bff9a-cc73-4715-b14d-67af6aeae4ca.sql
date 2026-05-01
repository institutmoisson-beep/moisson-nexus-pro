
-- ── Table urgent_cases ──────────────────────────────────────
CREATE TABLE public.urgent_cases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  images TEXT[] DEFAULT '{}',
  country TEXT,
  city TEXT,
  address TEXT,
  phone TEXT,
  severity TEXT NOT NULL DEFAULT 'medium', -- low, medium, high, critical
  status TEXT NOT NULL DEFAULT 'open',     -- open, in_progress, resolved, closed
  resolved_by UUID,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_urgent_cases_user ON public.urgent_cases(user_id);
CREATE INDEX idx_urgent_cases_status ON public.urgent_cases(status);
CREATE INDEX idx_urgent_cases_country_city ON public.urgent_cases(country, city);

ALTER TABLE public.urgent_cases ENABLE ROW LEVEL SECURITY;

-- Policies urgent_cases
CREATE POLICY "Users create own urgent cases"
  ON public.urgent_cases FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users view own urgent cases"
  ON public.urgent_cases FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users update own open urgent cases"
  ON public.urgent_cases FOR UPDATE
  USING (auth.uid() = user_id AND status = 'open');

CREATE POLICY "Admins manage all urgent cases"
  ON public.urgent_cases FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Regional staff view urgent cases in zone"
  ON public.urgent_cases FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM staff_roles sr
      WHERE sr.user_id = auth.uid()
        AND (
          (sr.role = 'moissonneur_pays' AND urgent_cases.country = sr.assigned_country)
          OR (sr.role = 'moissonneur_ville' AND urgent_cases.country = sr.assigned_country
              AND urgent_cases.city ILIKE sr.assigned_city)
        )
    )
  );

CREATE POLICY "Regional staff update urgent cases in zone"
  ON public.urgent_cases FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM staff_roles sr
      WHERE sr.user_id = auth.uid()
        AND (
          (sr.role = 'moissonneur_pays' AND urgent_cases.country = sr.assigned_country)
          OR (sr.role = 'moissonneur_ville' AND urgent_cases.country = sr.assigned_country
              AND urgent_cases.city ILIKE sr.assigned_city)
        )
    )
  );

CREATE TRIGGER trg_urgent_cases_updated_at
  BEFORE UPDATE ON public.urgent_cases
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ── Table urgent_case_responses ─────────────────────────────
CREATE TABLE public.urgent_case_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL REFERENCES public.urgent_cases(id) ON DELETE CASCADE,
  responder_id UUID NOT NULL,
  responder_role TEXT NOT NULL DEFAULT 'user', -- user, admin, moissonneur_pays, moissonneur_ville
  message TEXT NOT NULL,
  images TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_urgent_responses_case ON public.urgent_case_responses(case_id);

ALTER TABLE public.urgent_case_responses ENABLE ROW LEVEL SECURITY;

-- Helper: peut-on accéder à ce cas ?
CREATE OR REPLACE FUNCTION public.can_access_urgent_case(_case_id UUID, _user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM urgent_cases uc
    WHERE uc.id = _case_id
      AND (
        uc.user_id = _user_id
        OR has_role(_user_id, 'admin'::app_role)
        OR EXISTS (
          SELECT 1 FROM staff_roles sr
          WHERE sr.user_id = _user_id
            AND (
              (sr.role = 'moissonneur_pays' AND uc.country = sr.assigned_country)
              OR (sr.role = 'moissonneur_ville' AND uc.country = sr.assigned_country
                  AND uc.city ILIKE sr.assigned_city)
            )
        )
      )
  );
$$;

CREATE POLICY "View responses if can access case"
  ON public.urgent_case_responses FOR SELECT
  USING (public.can_access_urgent_case(case_id, auth.uid()));

CREATE POLICY "Insert response if can access case"
  ON public.urgent_case_responses FOR INSERT
  WITH CHECK (
    auth.uid() = responder_id
    AND public.can_access_urgent_case(case_id, auth.uid())
  );

-- ── Bucket Storage urgent-cases ─────────────────────────────
INSERT INTO storage.buckets (id, name, public)
VALUES ('urgent-cases', 'urgent-cases', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public read urgent-cases images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'urgent-cases');

CREATE POLICY "Authenticated upload urgent-cases"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'urgent-cases' AND auth.uid() IS NOT NULL);

CREATE POLICY "Owner delete urgent-cases image"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'urgent-cases' AND auth.uid()::text = (storage.foldername(name))[1]);
