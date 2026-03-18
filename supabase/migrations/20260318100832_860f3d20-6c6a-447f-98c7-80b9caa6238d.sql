
-- Create claim_assignments table
CREATE TABLE public.claim_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  claim_id uuid NOT NULL REFERENCES public.service_claims(id) ON DELETE CASCADE,
  partner_id uuid NOT NULL REFERENCES public.partners(id) ON DELETE CASCADE,
  assigned_by uuid,
  sla_deadline timestamp with time zone,
  status text NOT NULL DEFAULT 'pending',
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.claim_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage claim assignments" ON public.claim_assignments FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Partners can view own assignments" ON public.claim_assignments FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.partners WHERE partners.id = claim_assignments.partner_id AND partners.user_id = auth.uid()));
CREATE POLICY "Users can view assignments for own claims" ON public.claim_assignments FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.service_claims WHERE service_claims.id = claim_assignments.claim_id AND service_claims.user_id = auth.uid()));

-- Enable realtime for claim_assignments
ALTER PUBLICATION supabase_realtime ADD TABLE public.claim_assignments;
