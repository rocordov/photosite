-- SQL script to create the text_entries table in Supabase

-- This table will store text entries with automatic timestamps and IDs
CREATE TABLE text_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE text_entries ENABLE ROW LEVEL SECURITY;

-- Create a policy that allows anyone to read all rows
CREATE POLICY "Allow public read access" 
  ON text_entries 
  FOR SELECT 
  USING (true);

-- Create a policy that allows authenticated users to insert rows
CREATE POLICY "Allow authenticated insert access" 
  ON text_entries 
  FOR INSERT 
  WITH CHECK (auth.role() = 'authenticated' OR auth.role() = 'anon');

-- Create a policy that allows users to update only their own rows
-- (You'd need to add a user_id column and modify this if you implement user authentication)
CREATE POLICY "Allow users to update their own data" 
  ON text_entries 
  FOR UPDATE 
  USING (true);
