-- Fix RLS policy for admin_data table to allow INSERT/UPDATE operations

-- Drop existing policy to avoid conflicts
DROP POLICY IF EXISTS "Admins can manage admin_data" ON admin_data;

-- Create new policy that allows authenticated admin users to perform all operations
CREATE POLICY "Admins can manage admin_data"
ON admin_data
FOR ALL
TO authenticated
USING (
  (SELECT is_admin FROM public.user_profiles WHERE user_id = auth.uid()) = true
)
WITH CHECK (
  (SELECT is_admin FROM public.user_profiles WHERE user_id = auth.uid()) = true
);