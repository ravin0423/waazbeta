
CREATE TABLE public.customer_devices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  gadget_category_id uuid REFERENCES public.gadget_categories(id),
  subscription_plan_id uuid REFERENCES public.subscription_plans(id),
  product_name text NOT NULL,
  serial_number text NOT NULL,
  imei_number text,
  whatsapp_number text NOT NULL,
  address text NOT NULL,
  google_location_pin text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'expired', 'cancelled')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.customer_devices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own devices" ON public.customer_devices
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own devices" ON public.customer_devices
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own devices" ON public.customer_devices
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all devices" ON public.customer_devices
  FOR ALL TO public
  USING (has_role(auth.uid(), 'admin'::app_role));
