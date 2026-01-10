/*
  # Fix card_flip_games name column to be nullable

  1. Changes
    - Make `name` column nullable in card_flip_games table
    - This allows creating games without requiring a name field

  2. Notes
    - This fixes the 400 error when creating card flip games
    - The form validation ensures name is present before submission
*/

-- Make name column nullable
ALTER TABLE card_flip_games
  ALTER COLUMN name DROP NOT NULL;
