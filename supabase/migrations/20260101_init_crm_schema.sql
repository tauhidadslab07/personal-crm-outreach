-- Personal CRM & Outreach Operations Database Schema
-- Migration: 20260101_init_crm_schema.sql
-- Enables UUID generation and sets up comprehensive tables with FK constraints

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Leads Table (with auto-detected country columns)
CREATE TABLE IF NOT EXISTS leads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    phone_raw TEXT NOT NULL,
    phone_sanitized TEXT NOT NULL,
    iso_code VARCHAR(4) NOT NULL,
    country_code VARCHAR(10) NOT NULL,
    country_name TEXT NOT NULL,
    flag_emoji VARCHAR(10) NOT NULL,
    company TEXT,
    email TEXT,
    source TEXT NOT NULL DEFAULT 'Other',
    current_stage SMALLINT NOT NULL DEFAULT 0 CHECK (current_stage BETWEEN 0 AND 5),
    kill_switch_status TEXT NOT NULL DEFAULT 'active' CHECK (kill_switch_status IN ('active', 'booked_meeting', 'not_interested', 'wrong_number', 'completed')),
    kill_switch_reason TEXT,
    value NUMERIC(12, 2) DEFAULT 0,
    tags TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for instant phone number & stage lookups
CREATE INDEX IF NOT EXISTS idx_leads_phone_sanitized ON leads(phone_sanitized);
CREATE INDEX IF NOT EXISTS idx_leads_current_stage ON leads(current_stage);
CREATE INDEX IF NOT EXISTS idx_leads_kill_switch ON leads(kill_switch_status);
CREATE INDEX IF NOT EXISTS idx_leads_iso_code ON leads(iso_code);

-- 2. Cadence Stages Table (5-Stage WhatsApp cadence with intervals)
CREATE TABLE IF NOT EXISTS cadence_stages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    stage_number SMALLINT NOT NULL CHECK (stage_number BETWEEN 0 AND 5),
    title TEXT NOT NULL,
    scheduled_date DATE NOT NULL,
    sent_date TIMESTAMPTZ,
    is_sent BOOLEAN NOT NULL DEFAULT false,
    view_status TEXT NOT NULL DEFAULT 'unchecked' CHECK (view_status IN ('unchecked', 'seen', 'replied')),
    template_script TEXT NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cadence_stages_lead_id ON cadence_stages(lead_id);
CREATE INDEX IF NOT EXISTS idx_cadence_stages_scheduled ON cadence_stages(scheduled_date, is_sent);

-- 3. Intelligent Meetings Table (with buffer tracking & outcomes)
CREATE TABLE IF NOT EXISTS meetings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
    lead_name TEXT NOT NULL,
    lead_phone TEXT NOT NULL,
    lead_iso_code VARCHAR(4),
    lead_flag_emoji VARCHAR(10),
    meeting_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    meeting_link TEXT,
    location_notes TEXT,
    outcome TEXT NOT NULL DEFAULT 'pending' CHECK (outcome IN ('pending', 'closed_won', 'followup_needed', 'lost')),
    deal_value NUMERIC(12, 2) DEFAULT 0,
    reschedule_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_meetings_date_times ON meetings(meeting_date, start_time, end_time);
CREATE INDEX IF NOT EXISTS idx_meetings_lead_id ON meetings(lead_id);

-- 4. Client Projects & Financial Tracking
CREATE TABLE IF NOT EXISTS projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
    client_name TEXT NOT NULL,
    project_name TEXT NOT NULL,
    acquisition_date DATE NOT NULL DEFAULT CURRENT_DATE,
    delivery_deadline DATE NOT NULL,
    total_order_value NUMERIC(12, 2) NOT NULL DEFAULT 0,
    paid_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
    remaining_balance NUMERIC(12, 2) NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'delivered', 'revision', 'completed')),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_delivery_deadline ON projects(delivery_deadline);

-- 5. Daily Tasks Table
CREATE TABLE IF NOT EXISTS tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    due_date DATE NOT NULL DEFAULT CURRENT_DATE,
    priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
    is_completed BOOLEAN NOT NULL DEFAULT false,
    lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
    client_name TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date, is_completed);

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION update_timestamp_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_leads_updated_at BEFORE UPDATE ON leads
    FOR EACH ROW EXECUTE PROCEDURE update_timestamp_column();
