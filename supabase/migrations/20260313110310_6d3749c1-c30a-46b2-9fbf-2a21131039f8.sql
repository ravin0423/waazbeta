
ALTER TABLE public.invoices 
  ADD COLUMN IF NOT EXISTS line_item_description text NOT NULL DEFAULT 'Service / Subscription',
  ADD COLUMN IF NOT EXISTS subscription_plan_id uuid REFERENCES public.subscription_plans(id) ON DELETE SET NULL;
