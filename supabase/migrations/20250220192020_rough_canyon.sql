/*
  # Fix position update policy

  1. Changes
    - Drop the existing update policy
    - Create a new, more permissive update policy for todos
    
  2. Security
    - Ensures users can only update their own todos
    - Allows all fields to be updated as long as user_id remains unchanged
*/

-- First drop the existing policies
DROP POLICY IF EXISTS "Users can update own todos" ON todos;
DROP POLICY IF EXISTS "Users can update positions of own todos" ON todos;

-- Create a single, comprehensive update policy
CREATE POLICY "Users can update own todos"
  ON todos
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);