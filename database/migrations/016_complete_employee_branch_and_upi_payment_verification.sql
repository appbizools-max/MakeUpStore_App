-- ==============================================================================
-- SALBEAU ENTERPRISE EMPLOYEE, BRANCH MANAGEMENT & UPI VERIFICATION MIGRATION
-- Migration: 016_complete_employee_branch_and_upi_payment_verification.sql
-- ==============================================================================

-- 1. Ensure employee sequence for auto-generation of employee code
CREATE SEQUENCE IF NOT EXISTS public.employee_code_seq START 1;

-- 2. Add missing production columns to employees table
ALTER TABLE public.employees
ADD COLUMN IF NOT EXISTS employee_code TEXT,
ADD COLUMN IF NOT EXISTS full_name TEXT,
ADD COLUMN IF NOT EXISTS country_code TEXT DEFAULT '+91',
ADD COLUMN IF NOT EXISTS department TEXT DEFAULT 'Logistics',
ADD COLUMN IF NOT EXISTS designation TEXT DEFAULT 'Delivery Partner',
ADD COLUMN IF NOT EXISTS branch_id TEXT,
ADD COLUMN IF NOT EXISTS branch TEXT,
ADD COLUMN IF NOT EXISTS work_location TEXT,
ADD COLUMN IF NOT EXISTS account_status TEXT DEFAULT 'active',
ADD COLUMN IF NOT EXISTS employment_type TEXT DEFAULT 'Full-time',
ADD COLUMN IF NOT EXISTS joining_date DATE DEFAULT CURRENT_DATE,
ADD COLUMN IF NOT EXISTS user_id TEXT;

-- 3. Indexes on employees table
CREATE UNIQUE INDEX IF NOT EXISTS idx_employees_employee_code ON public.employees(employee_code);
CREATE INDEX IF NOT EXISTS idx_employees_account_status ON public.employees(account_status);
CREATE INDEX IF NOT EXISTS idx_employees_branch_id ON public.employees(branch_id);

-- 4. Create dedicated Branches table (Managed by Admin under Settings -> Branch Management)
CREATE TABLE IF NOT EXISTS public.branches (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    code TEXT UNIQUE NOT NULL,
    address TEXT,
    city TEXT,
    state TEXT,
    pin_code TEXT,
    contact_number TEXT,
    manager_name TEXT,
    manager_id TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_branches_code ON public.branches(code);
CREATE INDEX IF NOT EXISTS idx_branches_is_active ON public.branches(is_active);

-- Enable RLS on branches
ALTER TABLE public.branches ENABLE ROW LEVEL SECURITY;

-- Allow read access for authenticated & anon clients (idempotent policy)
DROP POLICY IF EXISTS "Public read active branches" ON public.branches;
CREATE POLICY "Public read active branches" ON public.branches
    FOR SELECT USING (true);

-- Allow full management for authenticated users / service role (idempotent policy)
DROP POLICY IF EXISTS "Allow management for all actions on branches" ON public.branches;
CREATE POLICY "Allow management for all actions on branches" ON public.branches
    FOR ALL USING (true) WITH CHECK (true);

-- 5. Create dedicated UPI Payment Verifications table
CREATE TABLE IF NOT EXISTS public.upi_payment_verifications (
    id TEXT PRIMARY KEY,
    order_id TEXT NOT NULL,
    customer_id TEXT,
    customer_name TEXT,
    delivery_partner_id TEXT,
    delivery_partner_name TEXT,
    branch_id TEXT,
    branch_name TEXT,
    expected_amount NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    reported_amount NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    upi_transaction_id TEXT,
    payment_proof_url TEXT NOT NULL,
    submission_date TIMESTAMPTZ DEFAULT NOW(),
    verification_status TEXT DEFAULT 'PENDING_VERIFICATION', -- 'PENDING', 'PENDING_VERIFICATION', 'VERIFIED', 'REJECTED'
    verified_by TEXT,
    verified_by_name TEXT,
    verified_at TIMESTAMPTZ,
    previous_status TEXT,
    rejection_reason TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_upi_order_id ON public.upi_payment_verifications(order_id);
CREATE INDEX IF NOT EXISTS idx_upi_verification_status ON public.upi_payment_verifications(verification_status);
CREATE INDEX IF NOT EXISTS idx_upi_submission_date ON public.upi_payment_verifications(submission_date DESC);

-- Enable RLS on upi_payment_verifications
ALTER TABLE public.upi_payment_verifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow read upi_payment_verifications" ON public.upi_payment_verifications;
CREATE POLICY "Allow read upi_payment_verifications" ON public.upi_payment_verifications
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow insert upi_payment_verifications" ON public.upi_payment_verifications;
CREATE POLICY "Allow insert upi_payment_verifications" ON public.upi_payment_verifications
    FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow update upi_payment_verifications" ON public.upi_payment_verifications;
CREATE POLICY "Allow update upi_payment_verifications" ON public.upi_payment_verifications
    FOR UPDATE USING (true) WITH CHECK (true);

-- 6. Helper function to generate safe unique employee code
CREATE OR REPLACE FUNCTION public.generate_next_employee_code()
RETURNS TEXT AS $$
DECLARE
    next_val BIGINT;
    generated_code TEXT;
    code_exists BOOLEAN;
BEGIN
    LOOP
        SELECT nextval('public.employee_code_seq') INTO next_val;
        generated_code := 'EMP-' || LPAD(next_val::TEXT, 4, '0');
        SELECT EXISTS(SELECT 1 FROM public.employees WHERE employee_code = generated_code) INTO code_exists;
        IF NOT code_exists THEN
            RETURN generated_code;
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- 7. Notify PostgREST to reload schema cache immediately
NOTIFY pgrst, 'reload schema';

SELECT '016_complete_employee_branch_and_upi_payment_verification migration ready' AS status;

