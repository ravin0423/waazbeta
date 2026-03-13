
-- Finance categories for income/expense classification
CREATE TABLE public.finance_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  type text NOT NULL DEFAULT 'expense', -- 'income' or 'expense'
  is_system boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.finance_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage finance categories" ON public.finance_categories FOR ALL TO public USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Authenticated can read finance categories" ON public.finance_categories FOR SELECT TO authenticated USING (true);

-- Unified finance transactions ledger
CREATE TABLE public.finance_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_date date NOT NULL DEFAULT CURRENT_DATE,
  type text NOT NULL DEFAULT 'income', -- 'income' or 'expense'
  category_id uuid REFERENCES public.finance_categories(id),
  description text NOT NULL,
  amount numeric NOT NULL DEFAULT 0,
  tax_amount numeric NOT NULL DEFAULT 0,
  gst_rate numeric NOT NULL DEFAULT 0,
  hsn_sac_code text,
  source_type text, -- 'invoice', 'manual', 'partner_payout'
  source_id uuid,
  payment_method text,
  payment_reference text,
  notes text,
  is_auto_generated boolean NOT NULL DEFAULT false,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.finance_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage finance transactions" ON public.finance_transactions FOR ALL TO public USING (has_role(auth.uid(), 'admin'));

-- Partner payouts with TDS
CREATE TABLE public.finance_partner_payouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id uuid REFERENCES public.partners(id) NOT NULL,
  payout_month date NOT NULL,
  gross_amount numeric NOT NULL DEFAULT 0,
  tds_rate numeric NOT NULL DEFAULT 10,
  tds_amount numeric NOT NULL DEFAULT 0,
  net_amount numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending', -- pending, processed, paid
  payment_method text,
  payment_reference text,
  paid_at timestamptz,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.finance_partner_payouts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage partner payouts" ON public.finance_partner_payouts FOR ALL TO public USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Partners can view own payouts" ON public.finance_partner_payouts FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.partners WHERE partners.id = finance_partner_payouts.partner_id AND partners.user_id = auth.uid())
);

-- Compliance/MSME editable key-value settings
CREATE TABLE public.finance_compliance_info (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  info_key text NOT NULL UNIQUE,
  info_label text NOT NULL,
  info_value text NOT NULL DEFAULT '',
  info_group text NOT NULL DEFAULT 'general', -- 'msme', 'gst', 'company', 'banking'
  display_order integer NOT NULL DEFAULT 0,
  is_editable boolean NOT NULL DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.finance_compliance_info ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage compliance info" ON public.finance_compliance_info FOR ALL TO public USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Authenticated can read compliance info" ON public.finance_compliance_info FOR SELECT TO authenticated USING (true);

-- GST return filing records per month
CREATE TABLE public.finance_gst_returns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  return_period date NOT NULL, -- first day of month
  return_type text NOT NULL DEFAULT 'GSTR-3B', -- GSTR-1, GSTR-3B
  total_taxable_value numeric NOT NULL DEFAULT 0,
  total_cgst numeric NOT NULL DEFAULT 0,
  total_sgst numeric NOT NULL DEFAULT 0,
  total_igst numeric NOT NULL DEFAULT 0,
  total_cess numeric NOT NULL DEFAULT 0,
  input_tax_credit numeric NOT NULL DEFAULT 0,
  net_tax_liability numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'draft', -- draft, filed, verified
  filed_at timestamptz,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.finance_gst_returns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage GST returns" ON public.finance_gst_returns FOR ALL TO public USING (has_role(auth.uid(), 'admin'));

-- Seed default finance categories
INSERT INTO public.finance_categories (name, type, is_system) VALUES
  ('Subscription Revenue', 'income', true),
  ('Service Revenue', 'income', true),
  ('Partner Commission', 'expense', true),
  ('Office Rent', 'expense', false),
  ('Salaries & Wages', 'expense', false),
  ('Software & Tools', 'expense', false),
  ('Marketing & Advertising', 'expense', false),
  ('Travel & Conveyance', 'expense', false),
  ('Professional Fees', 'expense', false),
  ('Utilities', 'expense', false),
  ('Repairs & Maintenance', 'expense', false),
  ('Insurance', 'expense', false),
  ('Miscellaneous', 'expense', false),
  ('GST Refund', 'income', false),
  ('Interest Income', 'income', false),
  ('Other Income', 'income', false);

-- Seed default compliance info
INSERT INTO public.finance_compliance_info (info_key, info_label, info_value, info_group, display_order) VALUES
  ('company_name', 'Company Legal Name', '', 'company', 1),
  ('company_pan', 'PAN Number', '', 'company', 2),
  ('company_tan', 'TAN Number', '', 'company', 3),
  ('company_cin', 'CIN Number', '', 'company', 4),
  ('registered_address', 'Registered Address', '', 'company', 5),
  ('gstin', 'GSTIN', '', 'gst', 1),
  ('gst_state_code', 'GST State Code', '', 'gst', 2),
  ('gst_registration_date', 'GST Registration Date', '', 'gst', 3),
  ('gst_return_frequency', 'GST Return Filing Frequency', 'Monthly', 'gst', 4),
  ('default_cgst_rate', 'Default CGST Rate (%)', '9', 'gst', 5),
  ('default_sgst_rate', 'Default SGST Rate (%)', '9', 'gst', 6),
  ('default_hsn_code', 'Default HSN/SAC Code', '997159', 'gst', 7),
  ('msme_registration', 'MSME Registration Status', '', 'msme', 1),
  ('udyam_number', 'Udyam Registration Number', '', 'msme', 2),
  ('msme_category', 'MSME Category', '', 'msme', 3),
  ('msme_activity', 'NIC Code / Activity', '', 'msme', 4),
  ('bank_name', 'Bank Name', '', 'banking', 1),
  ('bank_account_number', 'Account Number', '', 'banking', 2),
  ('bank_ifsc', 'IFSC Code', '', 'banking', 3),
  ('bank_branch', 'Branch Name', '', 'banking', 4),
  ('default_tds_rate', 'Default TDS Rate (%)', '10', 'banking', 5);
