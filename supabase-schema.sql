-- DocQline Medical Centre — Clinic Queue Management System
-- Supabase Database Schema
-- Run this in your Supabase SQL Editor (Dashboard > SQL Editor)

-- Create branches (clinic locations / departments) table
CREATE TABLE IF NOT EXISTS branches (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  phone TEXT NOT NULL,
  avg_transaction_time INTEGER NOT NULL DEFAULT 15, -- avg consultation time in minutes
  grace_period_minutes INTEGER NOT NULL DEFAULT 10, -- grace period for patient check-in confirmation
  is_active BOOLEAN NOT NULL DEFAULT true,
  max_in_building INTEGER NOT NULL DEFAULT 10,      -- max patients in waiting room
  exclude_in_service_from_capacity BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create patient queue tickets table
CREATE TABLE IF NOT EXISTS tickets (
  id TEXT PRIMARY KEY,
  queue_number INTEGER NOT NULL,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  member_id TEXT,                -- Patient / chart ID
  channel TEXT NOT NULL CHECK (channel IN ('SMS', 'WHATSAPP')),
  status TEXT NOT NULL CHECK (status IN (
    'REMOTE_WAITING', 'ELIGIBLE_FOR_ENTRY', 'IN_BUILDING',
    'WAITING', 'CALLED', 'ARRIVED', 'NOT_HERE',
    'IN_TRANSACTION', 'IN_SERVICE', 'SERVED', 'COMPLETED', 'REMOVED'
  )),
  branch_id TEXT NOT NULL REFERENCES branches(id),
  service_category TEXT CHECK (service_category IN (
    'GENERAL_CHECKUP', 'FOLLOW_UP', 'CONSULTATION',
    'VACCINATION', 'EMERGENCY', 'LAB_RESULTS', 'OTHER'
  )),
  counter_id TEXT,               -- Consultation room / station
  teller_id TEXT,                -- Doctor / staff member ID
  joined_at BIGINT NOT NULL,
  called_at BIGINT,
  eligible_for_entry_at BIGINT,  -- When patient was called to check in
  entered_building_at BIGINT,    -- When patient entered the waiting room
  left_building_at BIGINT,       -- When patient left the waiting room
  transaction_started_at BIGINT, -- When consultation started
  transaction_ended_at BIGINT,   -- When consultation ended
  bumped_at BIGINT,
  feedback_stars INTEGER,
  audit_notes TEXT,              -- Triage / reception notes
  status_history JSONB,          -- Audit log of all status transitions
  wait_time_minutes INTEGER,     -- Calculated pre-consultation wait time
  is_no_show BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Indexes for efficient lookups
CREATE INDEX IF NOT EXISTS idx_tickets_queue_number ON tickets(queue_number);
CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(status);
CREATE INDEX IF NOT EXISTS idx_tickets_branch_id ON tickets(branch_id);
CREATE INDEX IF NOT EXISTS idx_tickets_joined_at ON tickets(joined_at);
CREATE INDEX IF NOT EXISTS idx_tickets_created_at ON tickets(created_at);
CREATE INDEX IF NOT EXISTS idx_tickets_service_category ON tickets(service_category);
CREATE INDEX IF NOT EXISTS idx_tickets_teller_id ON tickets(teller_id);

-- Auto-update updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_tickets_updated_at BEFORE UPDATE ON tickets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_branches_updated_at BEFORE UPDATE ON branches
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS)
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE branches ENABLE ROW LEVEL SECURITY;

-- Policies (open for development — tighten with auth-based policies in production)
CREATE POLICY "Allow public inserts" ON tickets FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public reads" ON tickets FOR SELECT USING (true);
CREATE POLICY "Allow public updates" ON tickets FOR UPDATE USING (true);
CREATE POLICY "Allow public deletes" ON tickets FOR DELETE USING (true);
CREATE POLICY "Allow public reads" ON branches FOR SELECT USING (true);

-- Seed: Default clinic location
INSERT INTO branches (id, name, address, phone, avg_transaction_time, grace_period_minutes, is_active, max_in_building)
VALUES
  ('main-clinic', 'Main Clinic', '1 Health Avenue, DocQline Medical Centre', '+1-555-0100', 15, 10, true, 10)
ON CONFLICT (id) DO NOTHING;

-- Migration note:
-- If you have an existing database with the old credit-union service_category values
-- (DEPOSIT, WITHDRAWAL, TRANSFER, LOAN, ACCOUNT_OPENING, ACCOUNT_INQUIRY), run:
--
--   ALTER TABLE tickets DROP CONSTRAINT IF EXISTS tickets_service_category_check;
--   ALTER TABLE tickets ADD CONSTRAINT tickets_service_category_check
--     CHECK (service_category IN (
--       'GENERAL_CHECKUP', 'FOLLOW_UP', 'CONSULTATION',
--       'VACCINATION', 'EMERGENCY', 'LAB_RESULTS', 'OTHER'
--     ));
--   UPDATE tickets SET service_category = 'OTHER' WHERE service_category IS NOT NULL
--     AND service_category NOT IN (
--       'GENERAL_CHECKUP', 'FOLLOW_UP', 'CONSULTATION',
--       'VACCINATION', 'EMERGENCY', 'LAB_RESULTS', 'OTHER'
--     );
