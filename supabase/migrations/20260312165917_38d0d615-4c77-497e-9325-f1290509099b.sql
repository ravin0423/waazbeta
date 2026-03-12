
-- Gadget Categories table
CREATE TABLE public.gadget_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT NOT NULL DEFAULT 'smartphone',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Regions table
CREATE TABLE public.regions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  state TEXT NOT NULL,
  city TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Partners table
CREATE TABLE public.partners (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  region_id UUID REFERENCES public.regions(id),
  sla_turnaround_days INTEGER NOT NULL DEFAULT 7,
  commission_rate NUMERIC(5,2) NOT NULL DEFAULT 10.00,
  quality_rating NUMERIC(3,1) NOT NULL DEFAULT 5.0,
  total_repairs INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Allow public read/write for now (no auth yet)
ALTER TABLE public.gadget_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.regions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partners ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access to gadget_categories" ON public.gadget_categories FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to regions" ON public.regions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to partners" ON public.partners FOR ALL USING (true) WITH CHECK (true);
