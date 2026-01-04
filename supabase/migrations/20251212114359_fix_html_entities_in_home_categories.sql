/*
  # Fix HTML Entities in Home Categories
  
  1. Changes
    - Updates category_name field in home_categories table to decode HTML entities
    - Replaces &amp; with &
    - Replaces &quot; with "
    - Replaces &apos; with '
    - Replaces &lt; with <
    - Replaces &gt; with >
    
  2. Purpose
    - Fixes display issue where category names show HTML entities like &amp; instead of &
*/

-- Update existing category names to decode HTML entities
UPDATE home_categories
SET category_name = 
  REPLACE(
    REPLACE(
      REPLACE(
        REPLACE(
          REPLACE(category_name, '&amp;', '&'),
        '&quot;', '"'),
      '&apos;', ''''),
    '&lt;', '<'),
  '&gt;', '>');
