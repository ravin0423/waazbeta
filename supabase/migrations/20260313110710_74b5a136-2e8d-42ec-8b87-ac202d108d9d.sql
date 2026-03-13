
-- Create invoice_line_items table
CREATE TABLE public.invoice_line_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id uuid NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  description text NOT NULL,
  amount numeric NOT NULL DEFAULT 0,
  subscription_plan_id uuid REFERENCES public.subscription_plans(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.invoice_line_items ENABLE ROW LEVEL SECURITY;

-- Admins can manage all line items
CREATE POLICY "Admins can manage invoice line items"
  ON public.invoice_line_items FOR ALL TO public
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Customers can read line items of their own invoices
CREATE POLICY "Customers can read own invoice line items"
  ON public.invoice_line_items FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.invoices WHERE id = invoice_id AND user_id = auth.uid())
  );
