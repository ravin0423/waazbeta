
CREATE TABLE public.service_claims (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  device_id uuid REFERENCES public.customer_devices(id) ON DELETE SET NULL,
  imei_number text NOT NULL,
  issue_type text NOT NULL,
  description text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  admin_notes text,
  assigned_partner_id uuid REFERENCES public.partners(id) ON DELETE SET NULL,
  image_urls text[] DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.service_claims ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own claims"
  ON public.service_claims FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own claims"
  ON public.service_claims FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all claims"
  ON public.service_claims FOR ALL TO public
  USING (has_role(auth.uid(), 'admin'::app_role));

INSERT INTO storage.buckets (id, name, public) VALUES ('claim-images', 'claim-images', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Authenticated users can upload claim images"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'claim-images');

CREATE POLICY "Anyone can view claim images"
  ON storage.objects FOR SELECT TO public
  USING (bucket_id = 'claim-images');
