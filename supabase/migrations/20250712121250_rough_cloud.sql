/*
  # Add flashcard preference columns to user_preferences table

  1. New Columns
    - `flashcard_sound_enabled` (boolean, default: true)
    - `flashcard_spell_enabled` (boolean, default: true) 
    - `flashcard_camera_enabled` (boolean, default: false)
    - `flashcard_camera_flipped` (boolean, default: false)
    - `flashcard_ocr_enabled` (boolean, default: false)
    - `flashcard_qr_enabled` (boolean, default: false)

  2. Changes
    - Adds missing columns that the FlashcardContext is trying to save
    - Uses safe IF NOT EXISTS checks to prevent errors if columns already exist
    - Sets appropriate default values for each preference
*/

-- Add flashcard_sound_enabled column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_preferences' AND column_name = 'flashcard_sound_enabled'
  ) THEN
    ALTER TABLE user_preferences ADD COLUMN flashcard_sound_enabled boolean DEFAULT true;
  END IF;
END $$;

-- Add flashcard_spell_enabled column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_preferences' AND column_name = 'flashcard_spell_enabled'
  ) THEN
    ALTER TABLE user_preferences ADD COLUMN flashcard_spell_enabled boolean DEFAULT true;
  END IF;
END $$;

-- Add flashcard_camera_enabled column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_preferences' AND column_name = 'flashcard_camera_enabled'
  ) THEN
    ALTER TABLE user_preferences ADD COLUMN flashcard_camera_enabled boolean DEFAULT false;
  END IF;
END $$;

-- Add flashcard_camera_flipped column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_preferences' AND column_name = 'flashcard_camera_flipped'
  ) THEN
    ALTER TABLE user_preferences ADD COLUMN flashcard_camera_flipped boolean DEFAULT false;
  END IF;
END $$;

-- Add flashcard_ocr_enabled column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_preferences' AND column_name = 'flashcard_ocr_enabled'
  ) THEN
    ALTER TABLE user_preferences ADD COLUMN flashcard_ocr_enabled boolean DEFAULT false;
  END IF;
END $$;

-- Add flashcard_qr_enabled column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_preferences' AND column_name = 'flashcard_qr_enabled'
  ) THEN
    ALTER TABLE user_preferences ADD COLUMN flashcard_qr_enabled boolean DEFAULT false;
  END IF;
END $$;