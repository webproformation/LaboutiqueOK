/*
  # Add Button Fields to Home Slides
  
  1. Changes
    - Add `button_text` (text, optional) - Text displayed on the button
    - Add `button_url` (text, optional) - URL the button links to
  
  2. Notes
    - These fields allow adding a call-to-action button on each slide
    - Both fields are optional - button only shows if button_text is provided
*/

-- Add button fields to home_slides table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'home_slides' AND column_name = 'button_text'
  ) THEN
    ALTER TABLE home_slides ADD COLUMN button_text text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'home_slides' AND column_name = 'button_url'
  ) THEN
    ALTER TABLE home_slides ADD COLUMN button_url text;
  END IF;
END $$;