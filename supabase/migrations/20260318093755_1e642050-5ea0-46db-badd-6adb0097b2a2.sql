
-- Claim status updates timeline table
CREATE TABLE public.claim_status_updates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  claim_id uuid NOT NULL REFERENCES public.service_claims(id) ON DELETE CASCADE,
  status text NOT NULL,
  notes text,
  updated_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.claim_status_updates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage claim updates" ON public.claim_status_updates
  FOR ALL TO public USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view own claim updates" ON public.claim_status_updates
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.service_claims sc
    WHERE sc.id = claim_status_updates.claim_id AND sc.user_id = auth.uid()
  ));

-- Claim feedback table
CREATE TABLE public.claim_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  claim_id uuid NOT NULL REFERENCES public.service_claims(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  feedback_text text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.claim_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage feedback" ON public.claim_feedback
  FOR ALL TO public USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can insert own feedback" ON public.claim_feedback
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own feedback" ON public.claim_feedback
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- Insert initial status update trigger when claim is created
CREATE OR REPLACE FUNCTION public.handle_new_claim_status()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.claim_status_updates (claim_id, status, notes)
  VALUES (NEW.id, NEW.status, 'Claim submitted');
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_claim_created
  AFTER INSERT ON public.service_claims
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_claim_status();

-- Track status changes
CREATE OR REPLACE FUNCTION public.handle_claim_status_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.claim_status_updates (claim_id, status, notes)
    VALUES (NEW.id, NEW.status, 'Status changed to ' || NEW.status);
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_claim_status_changed
  AFTER UPDATE ON public.service_claims
  FOR EACH ROW EXECUTE FUNCTION public.handle_claim_status_change();

-- Enable realtime for claim_status_updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.claim_status_updates;
