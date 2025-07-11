-- Create plans table
CREATE TABLE public.plans (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL UNIQUE,
    description text,
    price numeric NOT NULL,
    currency text DEFAULT 'USD' NOT NULL,
    billing_period text DEFAULT 'monthly' NOT NULL,
    features jsonb DEFAULT '{}'::jsonb NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Add RLS to plans table
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage plans"
ON public.plans
FOR ALL
TO authenticated
USING (EXISTS ( SELECT 1
   FROM user_profiles
  WHERE ((user_profiles.user_id = auth.uid()) AND (user_profiles.is_admin = true))))
WITH CHECK (EXISTS ( SELECT 1
   FROM user_profiles
  WHERE ((user_profiles.user_id = auth.uid()) AND (user_profiles.is_admin = true))));

-- Create coupons table
CREATE TABLE public.coupons (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    code text NOT NULL UNIQUE,
    description text,
    discount_percentage integer NOT NULL,
    applicable_plans uuid[] DEFAULT '{}'::uuid[] NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    expires_at timestamp with time zone,
    usage_limit integer,
    used_count integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Add RLS to coupons table
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage coupons"
ON public.coupons
FOR ALL
TO authenticated
USING (EXISTS ( SELECT 1
   FROM user_profiles
  WHERE ((user_profiles.user_id = auth.uid()) AND (user_profiles.is_admin = true))))
WITH CHECK (EXISTS ( SELECT 1
   FROM user_profiles
  WHERE ((user_profiles.user_id = auth.uid()) AND (user_profiles.is_admin = true))));

-- Function to update updated_at column
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for plans table
CREATE TRIGGER update_plans_updated_at
BEFORE UPDATE ON public.plans
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger for coupons table
CREATE TRIGGER update_coupons_updated_at
BEFORE UPDATE ON public.coupons
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();