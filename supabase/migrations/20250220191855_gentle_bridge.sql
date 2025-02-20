/*
  # Add position update policy

  1. Changes
    - Add a new RLS policy to allow users to update positions of their own todos
    
  2. Security
    - Policy ensures users can only update positions of todos they own
    - Maintains data isolation between users
*/

CREATE POLICY "Users can update positions of own todos"
  ON todos
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (
    auth.uid() = user_id AND
    (text IS NOT NULL OR position IS NOT NULL)
  );