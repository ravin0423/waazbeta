
-- Claim messages table for customer-partner communication
CREATE TABLE public.claim_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  claim_id uuid NOT NULL REFERENCES public.service_claims(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL,
  sender_role text NOT NULL DEFAULT 'customer',
  message text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.claim_messages ENABLE ROW LEVEL SECURITY;

-- Customers can read messages on their own claims
CREATE POLICY "Users can read own claim messages" ON public.claim_messages
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM service_claims sc WHERE sc.id = claim_messages.claim_id AND sc.user_id = auth.uid()
  ));

-- Partners can read messages on claims assigned to them
CREATE POLICY "Partners can read assigned claim messages" ON public.claim_messages
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM service_claims sc
    JOIN partners p ON p.id = sc.assigned_partner_id
    WHERE sc.id = claim_messages.claim_id AND p.user_id = auth.uid()
  ));

-- Users can insert messages on their own claims
CREATE POLICY "Users can insert own claim messages" ON public.claim_messages
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = sender_id AND EXISTS (
    SELECT 1 FROM service_claims sc WHERE sc.id = claim_messages.claim_id AND sc.user_id = auth.uid()
  ));

-- Partners can insert messages on assigned claims
CREATE POLICY "Partners can insert assigned claim messages" ON public.claim_messages
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = sender_id AND EXISTS (
    SELECT 1 FROM service_claims sc
    JOIN partners p ON p.id = sc.assigned_partner_id
    WHERE sc.id = claim_messages.claim_id AND p.user_id = auth.uid()
  ));

-- Admins can manage all
CREATE POLICY "Admins can manage claim messages" ON public.claim_messages
  FOR ALL TO public
  USING (has_role(auth.uid(), 'admin'));

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.claim_messages;

-- Service schedules table
CREATE TABLE public.service_schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  claim_id uuid NOT NULL REFERENCES public.service_claims(id) ON DELETE CASCADE,
  customer_id uuid NOT NULL,
  partner_id uuid REFERENCES public.partners(id),
  preferred_date date NOT NULL,
  preferred_time text NOT NULL,
  special_requests text,
  status text NOT NULL DEFAULT 'requested',
  partner_response text,
  confirmed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.service_schedules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own schedules" ON public.service_schedules
  FOR ALL TO authenticated
  USING (auth.uid() = customer_id);

CREATE POLICY "Partners can view assigned schedules" ON public.service_schedules
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM partners p WHERE p.id = service_schedules.partner_id AND p.user_id = auth.uid()
  ));

CREATE POLICY "Partners can update assigned schedules" ON public.service_schedules
  FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM partners p WHERE p.id = service_schedules.partner_id AND p.user_id = auth.uid()
  ));

CREATE POLICY "Admins can manage all schedules" ON public.service_schedules
  FOR ALL TO public
  USING (has_role(auth.uid(), 'admin'));
