
CREATE TABLE public.claim_eligibility_checks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  claim_id UUID NOT NULL REFERENCES public.service_claims(id) ON DELETE CASCADE,
  subscription_active BOOLEAN NOT NULL DEFAULT false,
  device_approved BOOLEAN NOT NULL DEFAULT false,
  coverage_includes_issue BOOLEAN NOT NULL DEFAULT false,
  not_duplicate BOOLEAN NOT NULL DEFAULT true,
  claim_details_complete BOOLEAN NOT NULL DEFAULT false,
  risk_score INTEGER NOT NULL DEFAULT 0,
  risk_level TEXT NOT NULL DEFAULT 'low',
  recommendation TEXT NOT NULL DEFAULT 'manual_review',
  details JSONB NOT NULL DEFAULT '[]'::jsonb,
  checked_by UUID,
  checked_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.claim_eligibility_checks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage eligibility checks" ON public.claim_eligibility_checks
  FOR ALL TO public USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view own claim eligibility" ON public.claim_eligibility_checks
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.service_claims sc
    WHERE sc.id = claim_eligibility_checks.claim_id AND sc.user_id = auth.uid()
  ));
