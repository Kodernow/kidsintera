/*
  # Create required tables for the application
  
  1. Tables
    - user_preferences - Stores user preferences like theme
    - admin_data - Stores admin data like plans, coupons, etc.
    - user_subscriptions - Stores user subscription information
    - todos - Stores user todos
    - flashcard_progress - Stores user progress on flashcards
  
  2. Functions
    - update_updated_at_column - Updates updated_at column on row update
  
  3. Security
    - Enable RLS on all tables
    - Add appropriate policies for each table
*/

-- Create extension for UUID generation if not exists
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create user_preferences table
CREATE TABLE IF NOT EXISTS user_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  theme TEXT DEFAULT 'light',
  flashcard_sound_enabled BOOLEAN DEFAULT true,
  flashcard_spell_enabled BOOLEAN DEFAULT true,
  flashcard_camera_enabled BOOLEAN DEFAULT false,
  flashcard_camera_flipped BOOLEAN DEFAULT false,
  flashcard_ocr_enabled BOOLEAN DEFAULT false,
  flashcard_qr_enabled BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create trigger for updated_at
CREATE TRIGGER update_user_preferences_updated_at
BEFORE UPDATE ON user_preferences
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS on user_preferences
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

-- Create policy for user_preferences
CREATE POLICY "Users can view and update their own preferences"
ON user_preferences
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Create admin_data table
CREATE TABLE IF NOT EXISTS admin_data (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  data_type TEXT NOT NULL,
  data_key TEXT NOT NULL DEFAULT 'default',
  data_value JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (data_type, data_key)
);

-- Create trigger for updated_at
CREATE TRIGGER update_admin_data_updated_at
BEFORE UPDATE ON admin_data
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS on admin_data
ALTER TABLE admin_data ENABLE ROW LEVEL SECURITY;

-- Create policy for admin_data
CREATE POLICY "Only admins can access admin data"
ON admin_data
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

-- Create user_subscriptions table
CREATE TABLE IF NOT EXISTS user_subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'expired')),
  start_date TIMESTAMPTZ DEFAULT now(),
  end_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create trigger for updated_at
CREATE TRIGGER update_user_subscriptions_updated_at
BEFORE UPDATE ON user_subscriptions
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS on user_subscriptions
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;

-- Create policy for user_subscriptions
CREATE POLICY "Users can view their own subscriptions"
ON user_subscriptions
FOR SELECT
USING (auth.uid() = user_id);

-- Create policy for user_subscriptions
CREATE POLICY "Only admins can update subscriptions"
ON user_subscriptions
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM admin_users
    WHERE admin_users.email = (
      SELECT email FROM auth.users WHERE id = auth.uid()
    )
  )
);

-- Create policy for user_subscriptions
CREATE POLICY "Users can insert their own subscriptions"
ON user_subscriptions
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Create todos table
CREATE TABLE IF NOT EXISTS todos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'done')),
  due_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create trigger for updated_at
CREATE TRIGGER update_todos_updated_at
BEFORE UPDATE ON todos
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS on todos
ALTER TABLE todos ENABLE ROW LEVEL SECURITY;

-- Create policy for todos
CREATE POLICY "Users can manage their own todos"
ON todos
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Create flashcard_progress table
CREATE TABLE IF NOT EXISTS flashcard_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  flashcard_id TEXT NOT NULL,
  category_id TEXT NOT NULL,
  times_viewed INTEGER DEFAULT 0,
  times_correct INTEGER DEFAULT 0,
  last_viewed_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (user_id, flashcard_id)
);

-- Enable RLS on flashcard_progress
ALTER TABLE flashcard_progress ENABLE ROW LEVEL SECURITY;

-- Create policy for flashcard_progress
CREATE POLICY "Users can manage their own progress"
ON flashcard_progress
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Create admin_users table for admin access
CREATE TABLE IF NOT EXISTS admin_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on admin_users
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- Create policy for admin_users
CREATE POLICY "Only admins can access admin table"
ON admin_users
USING (
  EXISTS (
    SELECT 1 FROM admin_users
    WHERE admin_users.email = (
      SELECT email FROM auth.users WHERE id = auth.uid()
    )
  )
);

-- Insert default admin user
INSERT INTO admin_users (email)
VALUES ('admin@admin.com'), ('admin@demo.com')
ON CONFLICT (email) DO NOTHING;