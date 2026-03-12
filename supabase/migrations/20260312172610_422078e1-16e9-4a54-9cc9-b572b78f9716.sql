
CREATE TABLE public.subscription_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  code text NOT NULL,
  gadget_category_id uuid REFERENCES public.gadget_categories(id) ON DELETE SET NULL,
  annual_price numeric NOT NULL DEFAULT 0,
  covers_hardware_failure boolean NOT NULL DEFAULT true,
  covers_battery boolean NOT NULL DEFAULT true,
  covers_motherboard boolean NOT NULL DEFAULT true,
  covers_accidental_damage boolean NOT NULL DEFAULT false,
  covers_liquid_damage boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read subscription plans"
  ON public.subscription_plans FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage subscription plans"
  ON public.subscription_plans FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- Analytics events table for tracking subscriptions, claims, revenue over time
CREATE TABLE public.analytics_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type text NOT NULL, -- 'subscription', 'claim', 'revenue'
  event_date date NOT NULL DEFAULT CURRENT_DATE,
  amount numeric DEFAULT 0,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read analytics"
  ON public.analytics_events FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage analytics"
  ON public.analytics_events FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));
