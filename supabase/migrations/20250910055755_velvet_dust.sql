/*
  # Create users table

  1. New Tables
    - `users`
      - `id` (text, primary key) - using mobile number as ID
      - `mobile` (text, unique)
      - `name` (text)
      - `currency` (text, default 'INR')
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `users` table
    - Add policy for users to manage their own data
*/

CREATE TABLE IF NOT EXISTS users (
  id text PRIMARY KEY,
  mobile text UNIQUE NOT NULL,
  name text NOT NULL DEFAULT 'Lender',
  currency text NOT NULL DEFAULT 'INR',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Users can read and update their own data
CREATE POLICY "Users can manage own data"
  ON users
  FOR ALL
  TO authenticated
  USING (id = current_setting('app.current_user_id', true))
  WITH CHECK (id = current_setting('app.current_user_id', true));

-- Allow anonymous users to create accounts during OTP verification
CREATE POLICY "Allow user creation during signup"
  ON users
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Create trigger for updated_at
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_users_mobile ON users(mobile);