-- DocQline Supabase Database Schema
-- Run this in your Supabase SQL Editor (Dashboard > SQL Editor)

-- Create tickets table
CREATE TABLE IF NOT EXISTS tickets (
  id TEXT PRIMARY KEY,
  queue_number INTEGER NOT NULL,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  channel TEXT NOT NULL CHECK (channel IN ('SMS', 'WHATSAPP')),
  status TEXT NOT NULL CHECK (status IN ('WAITING', 'CALLED', 'ARRIVED', 'NOT_HERE', 'IN_CONSULT', 'SERVED', 'REMOVED')),
  joined_at BIGINT NOT NULL,
  called_at BIGINT,
  consult_started_at BIGINT,
  consult_ended_at BIGINT,
  bumped_at BIGINT,
  feedback_stars INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create indexes for efficient lookups
CREATE INDEX IF NOT EXISTS idx_tickets_queue_number ON tickets(queue_number);
CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(status);
CREATE INDEX IF NOT EXISTS idx_tickets_joined_at ON tickets(joined_at);
CREATE INDEX IF NOT EXISTS idx_tickets_created_at ON tickets(created_at);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_tickets_updated_at BEFORE UPDATE ON tickets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;

-- Create policy for public inserts (allows anyone to create tickets)
CREATE POLICY "Allow public inserts" ON tickets
  FOR INSERT
  WITH CHECK (true);

-- Create policy for public reads (allows anyone to read tickets)
CREATE POLICY "Allow public reads" ON tickets
  FOR SELECT
  USING (true);

-- Create policy for public updates (allows anyone to update tickets)
CREATE POLICY "Allow public updates" ON tickets
  FOR UPDATE
  USING (true);

-- Create policy for public deletes (allows anyone to delete tickets)
CREATE POLICY "Allow public deletes" ON tickets
  FOR DELETE
  USING (true);

-- Note: For production, you may want to restrict these policies based on:
-- - Authentication (user-based policies)
-- - IP whitelisting
-- - API key validation
-- - Role-based access control
