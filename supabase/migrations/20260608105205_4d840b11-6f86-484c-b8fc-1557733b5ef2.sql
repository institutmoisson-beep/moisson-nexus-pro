
CREATE TABLE IF NOT EXISTS public.user_agreements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  agreement_type TEXT NOT NULL,
  accepted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  signature_hash TEXT NOT NULL,
  user_agent TEXT,
  ip_hint TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, agreement_type)
);

GRANT SELECT, INSERT ON public.user_agreements TO authenticated;
GRANT ALL ON public.user_agreements TO service_role;

ALTER TABLE public.user_agreements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own agreements"
  ON public.user_agreements FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert own agreements"
  ON public.user_agreements FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins view all agreements"
  ON public.user_agreements FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
