/*
  # Add Avatar to Live Chat Messages
  
  1. Changes
    - Add avatar_url column to live_stream_chat_messages table
    - This enables displaying user profile pictures in live stream chat
    - Enhances the live streaming experience with visual user identification
    
  2. Notes
    - Existing messages will have null avatar_url (backward compatible)
    - New messages will include the user's avatar from their profile
*/

-- Add avatar_url column to live_stream_chat_messages
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'live_stream_chat_messages' AND column_name = 'avatar_url'
  ) THEN
    ALTER TABLE live_stream_chat_messages ADD COLUMN avatar_url text DEFAULT '';
  END IF;
END $$;
