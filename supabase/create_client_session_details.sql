-- SQL script to create the client_session_details table in Supabase
-- Execute this script using the Supabase CLI with the command:
-- supabase db query -f create_client_session_details.sql

-- Enable the pgcrypto extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Drop the table if it exists to start fresh
DROP TABLE IF EXISTS client_session_details;

-- Create the client_session_details table
CREATE TABLE client_session_details (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  browser TEXT,
  os TEXT,
  screen_resolution TEXT,
  language TEXT,
  user_agent TEXT,
  color_depth TEXT,
  timezone TEXT,
  cookies_enabled BOOLEAN,
  referring_url TEXT,
  ip_address TEXT
);

-- Add comment to table
COMMENT ON TABLE client_session_details IS 'Stores browser and session details from visitors';

-- Set up Row Level Security (RLS)
ALTER TABLE client_session_details ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow anonymous inserts" ON client_session_details;
DROP POLICY IF EXISTS "Allow authenticated users to view own entries" ON client_session_details;

-- Create a more permissive policy for anonymous inserts
CREATE POLICY "Allow anonymous inserts" 
  ON client_session_details 
  FOR INSERT 
  TO anon, authenticated
  WITH CHECK (true);

-- Create policy for querying data (restricted to authenticated users)
CREATE POLICY "Allow authenticated users to view all entries"
  ON client_session_details
  FOR SELECT
  TO authenticated
  USING (true);

-- Add indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_client_session_details_browser ON client_session_details (browser);
CREATE INDEX IF NOT EXISTS idx_client_session_details_os ON client_session_details (os);
CREATE INDEX IF NOT EXISTS idx_client_session_details_created_at ON client_session_details (created_at);
