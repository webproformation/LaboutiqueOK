/*
  # Add popup delay and max plays to wheel game settings

  ## Changes
  - Add `popup_delay_seconds` column to wheel_game_settings table (default 5 seconds)
  - Add `max_plays_per_user` column to wheel_game_settings table (default 0 = unlimited)
  
  ## Notes
  - popup_delay_seconds: Number of seconds to wait before showing the wheel popup
  - max_plays_per_user: Maximum total plays per user (0 = unlimited)
  - max_plays_per_day: Already exists, maximum plays per day (0 = unlimited)
*/

-- Add popup_delay_seconds column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'wheel_game_settings' AND column_name = 'popup_delay_seconds'
  ) THEN
    ALTER TABLE wheel_game_settings ADD COLUMN popup_delay_seconds integer DEFAULT 5;
  END IF;
END $$;

-- Add max_plays_per_user column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'wheel_game_settings' AND column_name = 'max_plays_per_user'
  ) THEN
    ALTER TABLE wheel_game_settings ADD COLUMN max_plays_per_user integer DEFAULT 0;
  END IF;
END $$;

-- Update existing settings with default values
UPDATE wheel_game_settings
SET 
  popup_delay_seconds = COALESCE(popup_delay_seconds, 5),
  max_plays_per_user = COALESCE(max_plays_per_user, 0)
WHERE popup_delay_seconds IS NULL OR max_plays_per_user IS NULL;