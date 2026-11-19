-- Migration 020: Create Customer Addresses and Business Expenses Tables
-- Enables multi-device customer address book synchronization and persistent admin expense tracking.

-- 1. ADDRESSES TABLE
CREATE TABLE IF NOT EXISTS public.addresses (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    name TEXT,
    phone TEXT,
    label TEXT DEFAULT 'Home',
    address_line TEXT NOT NULL,
    city TEXT,
    state TEXT,
    pincode TEXT,
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_addresses_user_id ON public.addresses(user_id);

-- Enable RLS on addresses
ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public select on addresses" ON public.addresses
    FOR SELECT USING (true);

CREATE POLICY "Allow public insert on addresses" ON public.addresses
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update on addresses" ON public.addresses
    FOR UPDATE USING (true);

CREATE POLICY "Allow public delete on addresses" ON public.addresses
    FOR DELETE USING (true);

-- 2. EXPENSES TABLE (For Admin Analytics & P&L Reporting)
CREATE TABLE IF NOT EXISTS public.expenses (
    id TEXT PRIMARY KEY,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    category TEXT NOT NULL,
    amount NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    description TEXT,
    payment_method TEXT DEFAULT 'upi',
    receipt_url TEXT,
    logged_by TEXT DEFAULT 'Admin',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_expenses_date ON public.expenses(date);
CREATE INDEX IF NOT EXISTS idx_expenses_category ON public.expenses(category);

-- Enable RLS on expenses
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public select on expenses" ON public.expenses
    FOR SELECT USING (true);

CREATE POLICY "Allow public insert on expenses" ON public.expenses
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update on expenses" ON public.expenses
    FOR UPDATE USING (true);

CREATE POLICY "Allow public delete on expenses" ON public.expenses
    FOR DELETE USING (true);
