/*
  # Add replay_url and fix live streams access

  ## Changes
  1. Add `replay_url` column to `live_streams` table for storing replay videos
  2. Update RLS policy to allow public access to ended streams (for replays)
  
  ## Security
  - Public can now view streams with status 'scheduled', 'live', or 'ended'
  - This allows users to access replays of past live streams
*/

-- Add replay_url column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'live_streams' AND column_name = 'replay_url'
  ) THEN
    ALTER TABLE live_streams ADD COLUMN replay_url text;
  END IF;
END $$;

-- Drop existing policy to recreate it
DROP POLICY IF EXISTS "Anyone can view live or scheduled streams" ON live_streams;

-- Create new policy that includes ended streams
CREATE POLICY "Anyone can view public streams"
  ON live_streams FOR SELECT
  USING (status IN ('scheduled', 'live', 'ended'));