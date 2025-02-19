/*
  # Create todos table with RLS policies

  1. New Tables
    - `todos`
      - `id` (uuid, primary key)
      - `text` (text, not null)
      - `completed` (boolean, default false)
      - `created_at` (timestamptz, default now())
      - `position` (integer, not null)
      - `user_id` (uuid, foreign key to auth.users)

  2. Security
    - Enable RLS on `todos` table
    - Add policies for CRUD operations
*/

CREATE TABLE IF NOT EXISTS todos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  text text NOT NULL,
  completed boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  position integer NOT NULL,
  user_id uuid REFERENCES auth.users(id) NOT NULL
);

ALTER TABLE todos ENABLE ROW LEVEL SECURITY;

-- Policy to allow users to read their own todos
CREATE POLICY "Users can read own todos"
  ON todos
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Policy to allow users to insert their own todos
CREATE POLICY "Users can insert own todos"
  ON todos
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Policy to allow users to update their own todos
CREATE POLICY "Users can update own todos"
  ON todos
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy to allow users to delete their own todos
CREATE POLICY "Users can delete own todos"
  ON todos
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);