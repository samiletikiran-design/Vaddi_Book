/*
  # Create OTP verification system

  1. New Tables
    - `otp_verifications`
      - `id` (uuid, primary key)
      - `mobile` (text, mobile number)
      - `otp_code` (text, 6-digit OTP)
      - `expires_at` (timestamp, expiration time)
      - `verified` (boolean, verification status)
      - `attempts` (integer, failed attempts counter)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on `otp_verifications` table
    - Add policies for OTP operations
    - Add cleanup function for expired OTPs

  3. Functions
    - Function to generate and send OTP
    - Function to verify OTP
    - Function to cleanup expired OTPs
*/

-- Create OTP verifications table
CREATE TABLE IF NOT EXISTS otp_verifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mobile text NOT NULL,
  otp_code text NOT NULL,
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '10 minutes'),
  verified boolean DEFAULT false,
  attempts integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE otp_verifications ENABLE ROW LEVEL SECURITY;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_otp_mobile ON otp_verifications(mobile);
CREATE INDEX IF NOT EXISTS idx_otp_expires_at ON otp_verifications(expires_at);
CREATE INDEX IF NOT EXISTS idx_otp_verified ON otp_verifications(verified);

-- RLS Policies
CREATE POLICY "Users can create OTP requests"
  ON otp_verifications
  FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Users can verify their OTP"
  ON otp_verifications
  FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Users can update their OTP verification"
  ON otp_verifications
  FOR UPDATE
  TO anon
  USING (true);

-- Function to generate OTP
CREATE OR REPLACE FUNCTION generate_otp(mobile_number text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  otp_code text;
  otp_id uuid;
  existing_count integer;
BEGIN
  -- Check rate limiting (max 3 OTP requests per mobile per hour)
  SELECT COUNT(*) INTO existing_count
  FROM otp_verifications
  WHERE mobile = mobile_number
    AND created_at > now() - interval '1 hour';
  
  IF existing_count >= 3 THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Too many OTP requests. Please try again later.'
    );
  END IF;

  -- Generate 6-digit OTP
  otp_code := LPAD(floor(random() * 1000000)::text, 6, '0');
  
  -- Insert OTP record
  INSERT INTO otp_verifications (mobile, otp_code)
  VALUES (mobile_number, otp_code)
  RETURNING id INTO otp_id;
  
  -- In a real application, you would send SMS here
  -- For demo purposes, we'll return the OTP (remove in production)
  RETURN json_build_object(
    'success', true,
    'otp_id', otp_id,
    'message', 'OTP sent successfully',
    'demo_otp', otp_code  -- Remove this in production
  );
END;
$$;

-- Function to verify OTP
CREATE OR REPLACE FUNCTION verify_otp(mobile_number text, otp_code text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  otp_record record;
  max_attempts constant integer := 3;
BEGIN
  -- Get the latest OTP for this mobile number
  SELECT * INTO otp_record
  FROM otp_verifications
  WHERE mobile = mobile_number
    AND verified = false
    AND expires_at > now()
  ORDER BY created_at DESC
  LIMIT 1;
  
  -- Check if OTP exists
  IF otp_record IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Invalid or expired OTP'
    );
  END IF;
  
  -- Check attempts limit
  IF otp_record.attempts >= max_attempts THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Maximum verification attempts exceeded'
    );
  END IF;
  
  -- Check OTP code
  IF otp_record.otp_code = otp_code THEN
    -- Mark as verified
    UPDATE otp_verifications
    SET verified = true
    WHERE id = otp_record.id;
    
    RETURN json_build_object(
      'success', true,
      'message', 'OTP verified successfully'
    );
  ELSE
    -- Increment attempts
    UPDATE otp_verifications
    SET attempts = attempts + 1
    WHERE id = otp_record.id;
    
    RETURN json_build_object(
      'success', false,
      'error', 'Invalid OTP code',
      'attempts_remaining', max_attempts - (otp_record.attempts + 1)
    );
  END IF;
END;
$$;

-- Function to cleanup expired OTPs (run periodically)
CREATE OR REPLACE FUNCTION cleanup_expired_otps()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM otp_verifications
  WHERE expires_at < now() - interval '1 day';
END;
$$;