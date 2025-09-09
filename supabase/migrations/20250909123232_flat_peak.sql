/*
  # Create tables for Lender's Ledger application

  1. New Tables
    - `lendies` - Store information about people who borrow money
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `name` (text)
      - `mobile` (text)
      - `address` (text, optional)
      - `photo` (text, optional - base64 or URL)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `loans` - Store loan information
      - `id` (uuid, primary key)
      - `lendie_id` (uuid, references lendies)
      - `user_id` (uuid, references auth.users)
      - `principal` (numeric)
      - `interest_rate` (numeric)
      - `rate_period` (text - WEEKLY, MONTHLY, YEARLY)
      - `interest_type` (text - SIMPLE, COMPOUND)
      - `loan_date` (date)
      - `is_emi` (boolean)
      - `emi_frequency` (text, optional - WEEKLY, MONTHLY, YEARLY)
      - `tenure` (integer, optional)
      - `due_date` (date, optional)
      - `status` (text - ACTIVE, CLOSED)
      - `is_archived` (boolean, default false)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `repayments` - Store repayment records
      - `id` (uuid, primary key)
      - `loan_id` (uuid, references loans)
      - `user_id` (uuid, references auth.users)
      - `amount` (numeric)
      - `date` (date)
      - `type` (text - PRINCIPAL, INTEREST, PRINCIPAL_INTEREST)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage their own data

  3. Indexes
    - Add indexes for better query performance
*/

-- Create lendies table
CREATE TABLE IF NOT EXISTS lendies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  mobile text NOT NULL,
  address text,
  photo text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create loans table
CREATE TABLE IF NOT EXISTS loans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lendie_id uuid NOT NULL REFERENCES lendies(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  principal numeric NOT NULL CHECK (principal > 0),
  interest_rate numeric NOT NULL CHECK (interest_rate >= 0),
  rate_period text NOT NULL CHECK (rate_period IN ('WEEKLY', 'MONTHLY', 'YEARLY')),
  interest_type text NOT NULL CHECK (interest_type IN ('SIMPLE', 'COMPOUND')),
  loan_date date NOT NULL,
  is_emi boolean DEFAULT false,
  emi_frequency text CHECK (emi_frequency IN ('WEEKLY', 'MONTHLY', 'YEARLY')),
  tenure integer CHECK (tenure > 0),
  due_date date,
  status text DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'CLOSED')),
  is_archived boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create repayments table
CREATE TABLE IF NOT EXISTS repayments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  loan_id uuid NOT NULL REFERENCES loans(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount numeric NOT NULL CHECK (amount > 0),
  date date NOT NULL,
  type text NOT NULL CHECK (type IN ('PRINCIPAL', 'INTEREST', 'PRINCIPAL_INTEREST')),
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE lendies ENABLE ROW LEVEL SECURITY;
ALTER TABLE loans ENABLE ROW LEVEL SECURITY;
ALTER TABLE repayments ENABLE ROW LEVEL SECURITY;

-- Create policies for lendies table
CREATE POLICY "Users can view their own lendies"
  ON lendies
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own lendies"
  ON lendies
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own lendies"
  ON lendies
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own lendies"
  ON lendies
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create policies for loans table
CREATE POLICY "Users can view their own loans"
  ON loans
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own loans"
  ON loans
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own loans"
  ON loans
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own loans"
  ON loans
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create policies for repayments table
CREATE POLICY "Users can view their own repayments"
  ON repayments
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own repayments"
  ON repayments
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own repayments"
  ON repayments
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own repayments"
  ON repayments
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_lendies_user_id ON lendies(user_id);
CREATE INDEX IF NOT EXISTS idx_lendies_mobile ON lendies(mobile);

CREATE INDEX IF NOT EXISTS idx_loans_lendie_id ON loans(lendie_id);
CREATE INDEX IF NOT EXISTS idx_loans_user_id ON loans(user_id);
CREATE INDEX IF NOT EXISTS idx_loans_status ON loans(status);
CREATE INDEX IF NOT EXISTS idx_loans_loan_date ON loans(loan_date);
CREATE INDEX IF NOT EXISTS idx_loans_due_date ON loans(due_date);

CREATE INDEX IF NOT EXISTS idx_repayments_loan_id ON repayments(loan_id);
CREATE INDEX IF NOT EXISTS idx_repayments_user_id ON repayments(user_id);
CREATE INDEX IF NOT EXISTS idx_repayments_date ON repayments(date);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers to automatically update updated_at
CREATE TRIGGER update_lendies_updated_at
  BEFORE UPDATE ON lendies
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_loans_updated_at
  BEFORE UPDATE ON loans
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();