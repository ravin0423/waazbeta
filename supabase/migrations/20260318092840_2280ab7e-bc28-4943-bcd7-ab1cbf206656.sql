
-- Add subscription date columns to customer_devices
ALTER TABLE public.customer_devices
ADD COLUMN IF NOT EXISTS subscription_start date,
ADD COLUMN IF NOT EXISTS subscription_end date,
ADD COLUMN IF NOT EXISTS auto_renew boolean NOT NULL DEFAULT false;

-- Create subscription renewal reminders tracking table
CREATE TABLE public.subscription_renewal_reminders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id uuid REFERENCES public.customer_devices(id) ON DELETE CASCADE NOT NULL,
  reminder_type text NOT NULL CHECK (reminder_type IN ('30day', '14day', '7day', 'expired')),
  sent_at timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.subscription_renewal_reminders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage reminders" ON public.subscription_renewal_reminders
  FOR ALL TO public USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view own reminders" ON public.subscription_renewal_reminders
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.customer_devices cd
    WHERE cd.id = subscription_renewal_reminders.device_id AND cd.user_id = auth.uid()
  ));

-- Create subscription history table
CREATE TABLE public.subscription_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id uuid REFERENCES public.customer_devices(id) ON DELETE CASCADE NOT NULL,
  user_id uuid NOT NULL,
  old_plan_id uuid REFERENCES public.subscription_plans(id),
  new_plan_id uuid REFERENCES public.subscription_plans(id) NOT NULL,
  old_end_date date,
  new_end_date date NOT NULL,
  amount_paid numeric NOT NULL DEFAULT 0,
  payment_method text,
  upi_transaction_id text,
  renewal_type text NOT NULL DEFAULT 'renewal' CHECK (renewal_type IN ('renewal', 'upgrade', 'new')),
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.subscription_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage subscription history" ON public.subscription_history
  FOR ALL TO public USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view own history" ON public.subscription_history
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own history" ON public.subscription_history
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
