/*
  # Migrate localStorage data to Supabase

  1. New Tables
    - `todos` - User todo items with status tracking
    - `flashcard_progress` - User progress on flashcards
    - `user_preferences` - User settings and preferences
    - `admin_data` - Admin-specific data (plans, coupons, etc.)

  2. Security
    - Enable RLS on all tables
    - Add policies for user data access
    - Admin-only access for admin_data table

  3. Features
    - All features use standard PostgreSQL functionality
    - Compatible with self-hosted Supabase instances
    - No cloud-specific features used
*/

-- Create todos table (replaces localStorage 'todos')
CREATE TABLE IF NOT EXISTS todos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  status text NOT NULL DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'done')),
  due_date timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create user_preferences table (replaces various localStorage settings)
CREATE TABLE IF NOT EXISTS user_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  theme text DEFAULT 'light' CHECK (theme IN ('light', 'dark')),
  flashcard_sound_enabled boolean DEFAULT true,
  flashcard_spell_enabled boolean DEFAULT true,
  flashcard_camera_enabled boolean DEFAULT false,
  flashcard_camera_flipped boolean DEFAULT false,
  flashcard_ocr_enabled boolean DEFAULT false,
  flashcard_qr_enabled boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create admin_data table (replaces localStorage admin data)
CREATE TABLE IF NOT EXISTS admin_data (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  data_type text NOT NULL, -- 'plans', 'coupons', 'users', etc.
  data_key text NOT NULL, -- unique identifier for the data item
  data_value jsonb NOT NULL, -- the actual data
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(data_type, data_key)
);

-- Enable RLS on all tables
ALTER TABLE todos ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_data ENABLE ROW LEVEL SECURITY;

-- Policies for todos table
CREATE POLICY "Users can manage own todos"
  ON todos
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policies for user_preferences table
CREATE POLICY "Users can manage own preferences"
  ON user_preferences
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policies for admin_data table (only admins can access)
CREATE POLICY "Only admins can access admin data"
  ON admin_data
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE admin_users.email = (
        SELECT email FROM auth.users WHERE id = auth.uid()
      )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE admin_users.email = (
        SELECT email FROM auth.users WHERE id = auth.uid()
      )
    )
  );

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Add updated_at triggers
CREATE TRIGGER update_todos_updated_at
  BEFORE UPDATE ON todos
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_preferences_updated_at
  BEFORE UPDATE ON user_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_admin_data_updated_at
  BEFORE UPDATE ON admin_data
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();