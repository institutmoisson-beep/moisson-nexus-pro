
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS id_card_front_url text,
  ADD COLUMN IF NOT EXISTS id_card_back_url text,
  ADD COLUMN IF NOT EXISTS is_verified boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS verified_at timestamptz,
  ADD COLUMN IF NOT EXISTS verified_by uuid;

-- Storage policies for private id-cards bucket (bucket created via tool)
CREATE POLICY "Users upload own id-cards"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'id-cards' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users update own id-cards"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'id-cards' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users read own id-cards"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'id-cards' AND ((storage.foldername(name))[1] = auth.uid()::text OR public.has_role(auth.uid(),'admin'::app_role)));

CREATE POLICY "Users delete own id-cards"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'id-cards' AND (storage.foldername(name))[1] = auth.uid()::text);
