
-- Customer feedback table (general service/partner feedback)
CREATE TABLE public.customer_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  related_claim_id uuid REFERENCES public.service_claims(id) ON DELETE SET NULL,
  related_device_id uuid REFERENCES public.customer_devices(id) ON DELETE SET NULL,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  feedback_text text,
  feedback_type text NOT NULL DEFAULT 'service',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.customer_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own feedback" ON public.customer_feedback
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage all feedback" ON public.customer_feedback
  FOR ALL TO public
  USING (has_role(auth.uid(), 'admin'));

-- NPS surveys table
CREATE TABLE public.nps_surveys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  score integer NOT NULL CHECK (score >= 0 AND score <= 10),
  comment text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.nps_surveys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own NPS" ON public.nps_surveys
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage all NPS" ON public.nps_surveys
  FOR ALL TO public
  USING (has_role(auth.uid(), 'admin'));

-- Customer engagement tracking
CREATE TABLE public.customer_engagement (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  action text NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.customer_engagement ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own engagement" ON public.customer_engagement
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can read all engagement" ON public.customer_engagement
  FOR SELECT TO public
  USING (has_role(auth.uid(), 'admin'));
