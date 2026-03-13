
-- 1. Add user_id to partners (link partner users to their partner record)
ALTER TABLE public.partners ADD COLUMN IF NOT EXISTS user_id uuid;

-- 2. Add referred_by_partner_id to customer_devices
ALTER TABLE public.customer_devices ADD COLUMN IF NOT EXISTS referred_by_partner_id uuid REFERENCES public.partners(id) ON DELETE SET NULL;

-- 3. Create service_tickets table
CREATE TABLE public.service_tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  subject text NOT NULL,
  description text NOT NULL,
  status text NOT NULL DEFAULT 'open',
  priority text NOT NULL DEFAULT 'medium',
  admin_response text,
  image_urls text[] DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.service_tickets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own tickets" ON public.service_tickets FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view own tickets" ON public.service_tickets FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage all tickets" ON public.service_tickets FOR ALL TO public USING (has_role(auth.uid(), 'admin'::app_role));

-- 4. Create invoices table
CREATE TABLE public.invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number text NOT NULL,
  customer_device_id uuid REFERENCES public.customer_devices(id) ON DELETE SET NULL,
  customer_name text NOT NULL,
  customer_email text,
  amount numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending',
  notes text,
  due_date date,
  paid_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage invoices" ON public.invoices FOR ALL TO public USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Authenticated can read own invoices" ON public.invoices FOR SELECT TO authenticated USING (true);

-- 5. Create purchase_orders table
CREATE TABLE public.purchase_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  po_number text NOT NULL,
  vendor text NOT NULL,
  description text,
  total_amount numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'draft',
  order_date date NOT NULL DEFAULT CURRENT_DATE,
  expected_delivery date,
  received_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.purchase_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage purchase orders" ON public.purchase_orders FOR ALL TO public USING (has_role(auth.uid(), 'admin'::app_role));

-- 6. Create purchase_order_items table
CREATE TABLE public.purchase_order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_order_id uuid NOT NULL REFERENCES public.purchase_orders(id) ON DELETE CASCADE,
  item_name text NOT NULL,
  quantity integer NOT NULL DEFAULT 1,
  unit_price numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.purchase_order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage PO items" ON public.purchase_order_items FOR ALL TO public USING (has_role(auth.uid(), 'admin'::app_role));

-- Storage bucket for ticket images
INSERT INTO storage.buckets (id, name, public) VALUES ('ticket-images', 'ticket-images', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Authenticated users can upload ticket images"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'ticket-images');

CREATE POLICY "Anyone can view ticket images"
  ON storage.objects FOR SELECT TO public
  USING (bucket_id = 'ticket-images');
