
-- Add rejection tracking columns to customer_devices
ALTER TABLE public.customer_devices
  ADD COLUMN IF NOT EXISTS rejection_reason text,
  ADD COLUMN IF NOT EXISTS rejected_at timestamp with time zone,
  ADD COLUMN IF NOT EXISTS rejected_by uuid;

-- Device approval logs (audit trail)
CREATE TABLE public.device_approval_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id uuid NOT NULL REFERENCES public.customer_devices(id) ON DELETE CASCADE,
  action text NOT NULL, -- 'submitted', 'approved', 'rejected', 'info_requested', 'resubmitted'
  admin_id uuid,
  reason text,
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.device_approval_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage approval logs" ON public.device_approval_logs
  FOR ALL TO public USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view own device logs" ON public.device_approval_logs
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM public.customer_devices cd WHERE cd.id = device_approval_logs.device_id AND cd.user_id = auth.uid())
  );

-- Device info requests
CREATE TABLE public.device_info_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id uuid NOT NULL REFERENCES public.customer_devices(id) ON DELETE CASCADE,
  info_needed text[] NOT NULL DEFAULT '{}',
  message text,
  requested_by uuid,
  deadline timestamp with time zone,
  responded_at timestamp with time zone,
  customer_response text,
  status text NOT NULL DEFAULT 'pending', -- 'pending', 'provided', 'expired'
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.device_info_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage info requests" ON public.device_info_requests
  FOR ALL TO public USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view own info requests" ON public.device_info_requests
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM public.customer_devices cd WHERE cd.id = device_info_requests.device_id AND cd.user_id = auth.uid())
  );

-- Notifications table
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  type text NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  related_id uuid,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications" ON public.notifications
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications" ON public.notifications
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all notifications" ON public.notifications
  FOR ALL TO public USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "System can insert notifications" ON public.notifications
  FOR INSERT TO authenticated WITH CHECK (true);

-- Enable realtime on key tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.device_approval_logs;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
