
-- Add tax and user linkage fields to invoices
ALTER TABLE public.invoices 
  ADD COLUMN IF NOT EXISTS subtotal numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS cgst_percent numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS sgst_percent numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS cgst_amount numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS sgst_amount numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS customer_device_id uuid;

-- Create storage bucket for digital signature
INSERT INTO storage.buckets (id, name, public)
VALUES ('company-assets', 'company-assets', true)
ON CONFLICT (id) DO NOTHING;

-- RLS for company-assets bucket
CREATE POLICY "Anyone can read company assets"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'company-assets');

CREATE POLICY "Admins can manage company assets"
  ON storage.objects FOR ALL TO authenticated
  USING (bucket_id = 'company-assets' AND has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (bucket_id = 'company-assets' AND has_role(auth.uid(), 'admin'::app_role));

-- Function to generate unique invoice number in format WaazDDMMYYYY###
CREATE OR REPLACE FUNCTION public.generate_invoice_number()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  today_str text;
  serial_num integer;
  new_number text;
BEGIN
  today_str := to_char(now(), 'DDMMYYYY');
  
  SELECT COALESCE(MAX(
    CAST(
      SUBSTRING(invoice_number FROM length('Waaz' || today_str) + 1)
      AS integer
    )
  ), 0) + 1
  INTO serial_num
  FROM public.invoices
  WHERE invoice_number LIKE 'Waaz' || today_str || '%';
  
  new_number := 'Waaz' || today_str || lpad(serial_num::text, 3, '0');
  
  RETURN new_number;
END;
$$;

-- RLS: customers can read their own invoices
CREATE POLICY "Customers can read own invoices"
  ON public.invoices FOR SELECT TO authenticated
  USING (user_id = auth.uid());
