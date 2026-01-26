-- Financial Institution Service Queue - Supabase Database Schema
-- Run this in your Supabase SQL Editor (Dashboard > SQL Editor)

-- Create branches table
CREATE TABLE IF NOT EXISTS branches (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  phone TEXT NOT NULL,
  avg_transaction_time INTEGER NOT NULL DEFAULT 8, -- in minutes, learned over time
  grace_period_minutes INTEGER NOT NULL DEFAULT 10, -- configurable grace period
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create tickets table (updated for financial institution)
CREATE TABLE IF NOT EXISTS tickets (
  id TEXT PRIMARY KEY,
  queue_number INTEGER NOT NULL,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  member_id TEXT, -- Optional member/customer ID
  channel TEXT NOT NULL CHECK (channel IN ('SMS', 'WHATSAPP')),
  status TEXT NOT NULL CHECK (status IN ('WAITING', 'CALLED', 'ARRIVED', 'NOT_HERE', 'IN_TRANSACTION', 'SERVED', 'REMOVED')),
  branch_id TEXT NOT NULL REFERENCES branches(id),
  service_category TEXT CHECK (service_category IN ('DEPOSIT', 'WITHDRAWAL', 'TRANSFER', 'LOAN', 'ACCOUNT_OPENING', 'ACCOUNT_INQUIRY', 'OTHER')),
  counter_id TEXT, -- Which counter/desk is serving
  teller_id TEXT, -- Which teller is serving
  joined_at BIGINT NOT NULL,
  called_at BIGINT,
  transaction_started_at BIGINT, -- Previously consult_started_at
  transaction_ended_at BIGINT, -- Previously consult_ended_at
  bumped_at BIGINT,
  feedback_stars INTEGER,
  audit_notes TEXT, -- Reception can add notes
  wait_time_minutes INTEGER, -- Calculated wait time
  is_no_show BOOLEAN DEFAULT false, -- Flagged as no-show
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create indexes for efficient lookups
CREATE INDEX IF NOT EXISTS idx_tickets_queue_number ON tickets(queue_number);
CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(status);
CREATE INDEX IF NOT EXISTS idx_tickets_branch_id ON tickets(branch_id);
CREATE INDEX IF NOT EXISTS idx_tickets_joined_at ON tickets(joined_at);
CREATE INDEX IF NOT EXISTS idx_tickets_created_at ON tickets(created_at);
CREATE INDEX IF NOT EXISTS idx_tickets_service_category ON tickets(service_category);
CREATE INDEX IF NOT EXISTS idx_tickets_teller_id ON tickets(teller_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at for tickets
CREATE TRIGGER update_tickets_updated_at BEFORE UPDATE ON tickets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create trigger to automatically update updated_at for branches
CREATE TRIGGER update_branches_updated_at BEFORE UPDATE ON branches
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE branches ENABLE ROW LEVEL SECURITY;

-- Create policies for tickets
CREATE POLICY "Allow public inserts" ON tickets
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow public reads" ON tickets
  FOR SELECT
  USING (true);

CREATE POLICY "Allow public updates" ON tickets
  FOR UPDATE
  USING (true);

CREATE POLICY "Allow public deletes" ON tickets
  FOR DELETE
  USING (true);

-- Create policies for branches
CREATE POLICY "Allow public reads" ON branches
  FOR SELECT
  USING (true);

-- Insert default branch (example: Laborie Credit Union inspired)
INSERT INTO branches (id, name, address, phone, avg_transaction_time, grace_period_minutes, is_active)
VALUES 
  ('main-branch', 'Main Branch', '123 Main Street, City, State 12345', '+1-555-0100', 8, 10, true),
  ('downtown-branch', 'Downtown Branch', '456 Commerce Ave, City, State 12345', '+1-555-0101', 7, 10, true)
ON CONFLICT (id) DO NOTHING;

-- Note: For production, you may want to restrict these policies based on:
-- - Authentication (user-based policies)
-- - IP whitelisting
-- - API key validation
-- - Role-based access control
