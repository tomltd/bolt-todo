/*
  # Add delegate column to todos table

  1. Changes
    - Add `delegate` column to `todos` table with default value 'T'
    - Update existing rows to have the default value
*/

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'todos' AND column_name = 'delegate'
  ) THEN
    ALTER TABLE todos ADD COLUMN delegate text NOT NULL DEFAULT 'T';
  END IF;
END $$;