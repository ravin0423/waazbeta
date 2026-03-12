
-- Role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'partner', 'customer');

-- Profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL DEFAULT '',
  phone TEXT,
  company TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- User roles table (separate as required)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE(user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Feature permissions table (admin controls which features each role can access)
CREATE TABLE public.feature_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role app_role NOT NULL,
  feature_key TEXT NOT NULL,
  feature_label TEXT NOT NULL,
  is_enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(role, feature_key)
);

ALTER TABLE public.feature_permissions ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles (avoids recursive RLS)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Get user's primary role
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id UUID)
RETURNS app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.user_roles
  WHERE user_id = _user_id
  LIMIT 1
$$;

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''), NEW.email);
  
  -- Default role: customer
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'customer');
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- RLS Policies for profiles
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles" ON public.profiles
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for user_roles
CREATE POLICY "Users can view own roles" ON public.user_roles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all roles" ON public.user_roles
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for feature_permissions (read for authenticated, write for admin)
CREATE POLICY "Authenticated can read permissions" ON public.feature_permissions
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage permissions" ON public.feature_permissions
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Update existing tables to have proper admin-only write policies
DROP POLICY IF EXISTS "Allow all access to gadget_categories" ON public.gadget_categories;
DROP POLICY IF EXISTS "Allow all access to regions" ON public.regions;
DROP POLICY IF EXISTS "Allow all access to partners" ON public.partners;

-- Gadget categories: public read, admin write
CREATE POLICY "Anyone can read categories" ON public.gadget_categories
  FOR SELECT USING (true);
CREATE POLICY "Admins can manage categories" ON public.gadget_categories
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Regions: public read, admin write
CREATE POLICY "Anyone can read regions" ON public.regions
  FOR SELECT USING (true);
CREATE POLICY "Admins can manage regions" ON public.regions
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Partners: public read, admin write
CREATE POLICY "Anyone can read partners" ON public.partners
  FOR SELECT USING (true);
CREATE POLICY "Admins can manage partners" ON public.partners
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));
