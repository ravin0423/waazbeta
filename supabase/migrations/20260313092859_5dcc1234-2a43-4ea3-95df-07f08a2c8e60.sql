
-- 1. Approval checklist items (dynamic, managed by admin)
CREATE TABLE public.approval_checklist_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  label text NOT NULL,
  description text,
  display_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.approval_checklist_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage checklist items" ON public.approval_checklist_items
  FOR ALL TO public USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Authenticated can read active checklist items" ON public.approval_checklist_items
  FOR SELECT TO authenticated USING (true);

-- 2. Device approval checks (tracks which checklist items were completed per device)
CREATE TABLE public.device_approval_checks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id uuid NOT NULL REFERENCES public.customer_devices(id) ON DELETE CASCADE,
  checklist_item_id uuid NOT NULL REFERENCES public.approval_checklist_items(id) ON DELETE CASCADE,
  is_checked boolean NOT NULL DEFAULT false,
  checked_by uuid REFERENCES auth.users(id),
  checked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(device_id, checklist_item_id)
);

ALTER TABLE public.device_approval_checks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage approval checks" ON public.device_approval_checks
  FOR ALL TO public USING (has_role(auth.uid(), 'admin'));

-- 3. Add payment columns to customer_devices
ALTER TABLE public.customer_devices
  ADD COLUMN payment_method text DEFAULT NULL,
  ADD COLUMN upi_transaction_id text DEFAULT NULL,
  ADD COLUMN payment_status text NOT NULL DEFAULT 'pending',
  ADD COLUMN approved_by uuid REFERENCES auth.users(id) DEFAULT NULL,
  ADD COLUMN approved_at timestamptz DEFAULT NULL;

-- 4. UPI settings table (admin uploads QR code URL and UPI ID)
CREATE TABLE public.payment_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key text NOT NULL UNIQUE,
  setting_value text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.payment_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage payment settings" ON public.payment_settings
  FOR ALL TO public USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Authenticated can read payment settings" ON public.payment_settings
  FOR SELECT TO authenticated USING (true);

-- 5. Storage bucket for UPI QR code images
INSERT INTO storage.buckets (id, name, public) VALUES ('payment-assets', 'payment-assets', true);

CREATE POLICY "Admins can upload payment assets" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (
    bucket_id = 'payment-assets' AND has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Anyone can read payment assets" ON storage.objects
  FOR SELECT TO public USING (bucket_id = 'payment-assets');

CREATE POLICY "Admins can delete payment assets" ON storage.objects
  FOR DELETE TO authenticated USING (
    bucket_id = 'payment-assets' AND has_role(auth.uid(), 'admin')
  );
