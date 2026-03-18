
CREATE TABLE public.partner_commissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID NOT NULL REFERENCES public.partners(id) ON DELETE CASCADE,
  claim_id UUID NOT NULL REFERENCES public.service_claims(id) ON DELETE CASCADE,
  claim_amount NUMERIC NOT NULL DEFAULT 0,
  base_commission_rate NUMERIC NOT NULL DEFAULT 0,
  base_commission_amount NUMERIC NOT NULL DEFAULT 0,
  sla_bonus NUMERIC NOT NULL DEFAULT 0,
  rating_bonus NUMERIC NOT NULL DEFAULT 0,
  volume_bonus NUMERIC NOT NULL DEFAULT 0,
  penalty_deduction NUMERIC NOT NULL DEFAULT 0,
  total_commission NUMERIC NOT NULL DEFAULT 0,
  commission_month TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'calculated',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.partner_commissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage commissions" ON public.partner_commissions FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Partners can view own commissions" ON public.partner_commissions FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.partners WHERE partners.id = partner_commissions.partner_id AND partners.user_id = auth.uid())
);

CREATE INDEX idx_commissions_partner ON public.partner_commissions(partner_id);
CREATE INDEX idx_commissions_month ON public.partner_commissions(commission_month);
CREATE INDEX idx_commissions_claim ON public.partner_commissions(claim_id);
