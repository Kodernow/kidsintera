```sql
-- This script consolidates the entire Supabase database schema for the project.
-- It includes table definitions, Row Level Security (RLS) policies, functions, and triggers.
-- This script assumes a fresh Supabase project and should be run in the Supabase SQL Editor.

-- 1. User Profiles Table (from 20250709194810_cool_oasis.sql)
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,
  avatar_url text,
  is_admin boolean DEFAULT false, -- Added for admin functionality
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS for user_profiles
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Policies for user_profiles
CREATE POLICY "Users can view own profile"
  ON public.user_profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile"
  ON public.user_profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile"
  ON public.user_profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Function to automatically create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.user_profiles (user_id, full_name)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'full_name', new.email)
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 2. Admin Users Table (from 20250709194810_cool_oasis.sql)
-- Note: The application's isAdmin check is based on email, and user_profiles now has is_admin.
-- This table might be redundant if user_profiles.is_admin is the source of truth.
-- For consistency with the migration, it's included, but consider consolidating admin logic.
CREATE TABLE IF NOT EXISTS public.admin_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id),
  UNIQUE(email)
);

ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- Insert default admin user (update email as needed)
INSERT INTO public.admin_users (email)
VALUES ('admin@admin.com'), ('admin@demo.com')
ON CONFLICT (email) DO NOTHING;

-- Policy for admin_users
CREATE POLICY "Only admins can access admin table"
  ON public.admin_users
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid())
    )
  );

-- 3. User Preferences Table (inferred base + columns from 10_5_UserPreferences&FlashCards)
CREATE TABLE IF NOT EXISTS public.user_preferences (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    theme text DEFAULT 'light' NOT NULL, -- Inferred from ThemeContext
    flashcard_sound_enabled boolean DEFAULT true,
    flashcard_spell_enabled boolean DEFAULT true,
    flashcard_camera_enabled boolean DEFAULT false,
    flashcard_camera_flipped boolean DEFAULT false,
    flashcard_ocr_enabled boolean DEFAULT false,
    flashcard_qr_enabled boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    UNIQUE(user_id)
);

ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own preferences"
  ON public.user_preferences
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own preferences"
  ON public.user_preferences
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own preferences"
  ON public.user_preferences
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- 4. Plans Table (from 20250711110740_dry_surf.sql)
CREATE TABLE IF NOT EXISTS public.plans (
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
   FROM public.user_profiles
  WHERE ((public.user_profiles.user_id = auth.uid()) AND (public.user_profiles.is_admin = true))))
WITH CHECK (EXISTS ( SELECT 1
   FROM public.user_profiles
  WHERE ((public.user_profiles.user_id = auth.uid()) AND (public.user_profiles.is_admin = true))));

-- 5. Coupons Table (from 20250711110740_dry_surf.sql)
CREATE TABLE IF NOT EXISTS public.coupons (
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
   FROM public.user_profiles
  WHERE ((public.user_profiles.user_id = auth.uid()) AND (public.user_profiles.is_admin = true))))
WITH CHECK (EXISTS ( SELECT 1
   FROM public.user_profiles
  WHERE ((public.user_profiles.user_id = auth.uid()) AND (public.user_profiles.is_admin = true))));

-- 6. Flashcard Categories Table (from 20250711103838_soft_grove.sql)
CREATE TABLE IF NOT EXISTS public.flashcard_categories (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    description text,
    color text NOT NULL,
    icon text NOT NULL,
    age_group text NOT NULL,
    model_url text,
    created_at timestamp with time zone DEFAULT now()
);

-- Enable Row Level Security for flashcard_categories
ALTER TABLE public.flashcard_categories ENABLE ROW LEVEL SECURITY;

-- Policy for flashcard_categories: Admins can do everything
CREATE POLICY "Admins can manage flashcard_categories"
ON public.flashcard_categories
FOR ALL
TO authenticated
USING (EXISTS (SELECT 1 FROM public.user_profiles WHERE user_id = auth.uid() AND is_admin = TRUE))
WITH CHECK (EXISTS (SELECT 1 FROM public.user_profiles WHERE user_id = auth.uid() AND is_admin = TRUE));

-- 7. Flashcards Table (from 20250711103838_soft_grove.sql)
CREATE TABLE IF NOT EXISTS public.flashcards (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id uuid NOT NULL,
    title text NOT NULL,
    description text,
    image_url text NOT NULL,
    sound_url text NOT NULL,
    pronunciation text,
    spelling text NOT NULL,
    difficulty text NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT fk_category
        FOREIGN KEY (category_id)
        REFERENCES public.flashcard_categories(id)
        ON DELETE CASCADE,
    CONSTRAINT chk_difficulty CHECK (difficulty IN ('easy', 'medium', 'hard'))
);

-- Enable Row Level Security for flashcards
ALTER TABLE public.flashcards ENABLE ROW LEVEL SECURITY;

-- Policy for flashcards: Admins can do everything
CREATE POLICY "Admins can manage flashcards"
ON public.flashcards
FOR ALL
TO authenticated
USING (EXISTS (SELECT 1 FROM public.user_profiles WHERE user_id = auth.uid() AND is_admin = TRUE))
WITH CHECK (EXISTS (SELECT 1 FROM public.user_profiles WHERE user_id = auth.uid() AND is_admin = TRUE));

-- 8. Todos Table (from 20250709194824_proud_coral.sql)
CREATE TABLE IF NOT EXISTS public.todos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  status text NOT NULL DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'done')),
  due_date timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.todos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own todos"
  ON public.todos
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 9. User Subscriptions Table (from 20250709194824_proud_coral.sql)
CREATE TABLE IF NOT EXISTS public.user_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_name text NOT NULL DEFAULT 'Free', -- This should ideally reference the plans table by ID
  plan_features jsonb DEFAULT '{"todoboardEnabled": true, "customDomain": false, "prioritySupport": false}'::jsonb,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'expired')),
  start_date timestamptz DEFAULT now(),
  end_date timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own subscription"
  ON public.user_subscriptions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- 10. Flashcard Progress Tracking Table (from 20250709194824_proud_coral.sql)
CREATE TABLE IF NOT EXISTS public.flashcard_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  flashcard_id text NOT NULL, -- This should ideally reference the flashcards table by ID
  category_id text NOT NULL, -- This should ideally reference the flashcard_categories table by ID
  times_viewed integer DEFAULT 0,
  times_correct integer DEFAULT 0,
  last_viewed_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, flashcard_id)
);

ALTER TABLE public.flashcard_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own progress"
  ON public.flashcard_progress
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 11. Function to update updated_at column (from 20250709194824_proud_coral.sql and 20250711110740_dry_surf.sql)
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 12. Add update triggers for tables with 'updated_at' column
DROP TRIGGER IF EXISTS update_todos_updated_at ON public.todos;
CREATE TRIGGER update_todos_updated_at BEFORE UPDATE ON public.todos FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON public.user_profiles;
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON public.user_profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_subscriptions_updated_at ON public.user_subscriptions;
CREATE TRIGGER update_user_subscriptions_updated_at BEFORE UPDATE ON public.user_subscriptions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_plans_updated_at ON public.plans;
CREATE TRIGGER update_plans_updated_at
BEFORE UPDATE ON public.plans
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_coupons_updated_at ON public.coupons;
CREATE TRIGGER update_coupons_updated_at
BEFORE UPDATE ON public.coupons
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_preferences_updated_at ON public.user_preferences;
CREATE TRIGGER update_user_preferences_updated_at BEFORE UPDATE ON public.user_preferences FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

```