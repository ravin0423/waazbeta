
CREATE TABLE public.customer_activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL,
  activity_type TEXT NOT NULL,
  description TEXT NOT NULL,
  related_device_id UUID NULL,
  related_claim_id UUID NULL,
  related_ticket_id UUID NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  activity_timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.customer_activity_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage activity logs" ON public.customer_activity_log FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Users can view own activity" ON public.customer_activity_log FOR SELECT USING (auth.uid() = customer_id);
CREATE POLICY "Authenticated can insert activity" ON public.customer_activity_log FOR INSERT TO authenticated WITH CHECK (auth.uid() = customer_id);

CREATE INDEX idx_activity_log_customer ON public.customer_activity_log(customer_id);
CREATE INDEX idx_activity_log_timestamp ON public.customer_activity_log(activity_timestamp DESC);

ALTER PUBLICATION supabase_realtime ADD TABLE public.customer_activity_log;
