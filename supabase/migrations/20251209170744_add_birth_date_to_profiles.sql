/*
  # Add birth date field to profiles

  1. Changes
    - Add `birth_date` column to `profiles` table
      - Type: date (allows NULL)
      - Optional field for storing user's birthday
    
  2. Notes
    - Birth date is optional and can be NULL
    - Users can add or update their birthday in their account settings
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'birth_date'
  ) THEN
    ALTER TABLE profiles ADD COLUMN birth_date date DEFAULT NULL;
  END IF;
END $$;
