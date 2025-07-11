-- Fix user_preferences table structure
ALTER TABLE public.user_preferences
ADD COLUMN IF NOT EXISTS flashcard_sound_enabled BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS flashcard_spell_enabled BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS flashcard_camera_enabled BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS flashcard_camera_flipped BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS flashcard_ocr_enabled BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS flashcard_qr_enabled BOOLEAN DEFAULT FALSE;

-- Drop existing primary key constraint if it exists
ALTER TABLE public.user_preferences DROP CONSTRAINT IF EXISTS user_preferences_pkey;

-- Ensure user_id is the primary key for upsert operations to work correctly
ALTER TABLE public.user_preferences
ADD CONSTRAINT user_preferences_pkey PRIMARY KEY (user_id);

-- Fix admin_data RLS policy
ALTER TABLE public.admin_data ENABLE ROW LEVEL SECURITY;

-- Drop existing policy if it conflicts
DROP POLICY IF EXISTS "Allow admin to manage their own admin_data" ON public.admin_data;
DROP POLICY IF EXISTS "Admins can manage admin data" ON public.admin_data;

-- Create a new policy that allows authenticated users marked as admin to manage admin_data
CREATE POLICY "Allow admin to manage admin_data"
ON public.admin_data FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_profiles 
    WHERE user_profiles.user_id = auth.uid() 
    AND user_profiles.is_admin = TRUE
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_profiles 
    WHERE user_profiles.user_id = auth.uid() 
    AND user_profiles.is_admin = TRUE
  )
);