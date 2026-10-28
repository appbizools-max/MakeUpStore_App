-- ==============================================================================
-- SALBEAU ENTERPRISE EMPLOYEE MANAGEMENT WORKFLOW MIGRATION
-- Migration: 008_employee_management_workflow.sql
-- ==============================================================================

-- 1. Ensure employee sequence for concurrency-safe auto-generation
CREATE SEQUENCE IF NOT EXISTS public.employee_code_seq START 1;

-- 2. Alter employees table to add full production fields
ALTER TABLE public.employees
ADD COLUMN IF NOT EXISTS employee_code TEXT,
ADD COLUMN IF NOT EXISTS full_name TEXT,
ADD COLUMN IF NOT EXISTS country_code TEXT DEFAULT '+91',
ADD COLUMN IF NOT EXISTS department TEXT DEFAULT 'Operations',
ADD COLUMN IF NOT EXISTS designation TEXT DEFAULT 'Fulfillment Specialist',
ADD COLUMN IF NOT EXISTS joining_date DATE DEFAULT CURRENT_DATE,
ADD COLUMN IF NOT EXISTS employment_type TEXT DEFAULT 'Full-time',
ADD COLUMN IF NOT EXISTS reporting_manager_id TEXT,
ADD COLUMN IF NOT EXISTS reporting_manager_name TEXT,
ADD COLUMN IF NOT EXISTS work_location TEXT DEFAULT 'Visakhapatnam Main Store & Headquarters',
ADD COLUMN IF NOT EXISTS account_status TEXT DEFAULT 'active',
ADD COLUMN IF NOT EXISTS onboarding_method TEXT DEFAULT 'temporary_password',
ADD COLUMN IF NOT EXISTS invitation_token TEXT,
ADD COLUMN IF NOT EXISTS invitation_sent_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS invitation_expires_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS profile_photo TEXT,
ADD COLUMN IF NOT EXISTS force_password_reset BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS user_id TEXT;

-- 3. Unique indexes for identity and employee ID enforcement
CREATE UNIQUE INDEX IF NOT EXISTS idx_employees_employee_code ON public.employees(employee_code);
CREATE UNIQUE INDEX IF NOT EXISTS idx_employees_email ON public.employees(email);
CREATE INDEX IF NOT EXISTS idx_employees_account_status ON public.employees(account_status);
CREATE INDEX IF NOT EXISTS idx_employees_department ON public.employees(department);
CREATE INDEX IF NOT EXISTS idx_employees_user_id ON public.employees(user_id);

-- 4. Concurrency-safe function to generate the next unique Employee Code
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

-- 5. Helper function for secure employee onboarding invitation verification
CREATE OR REPLACE FUNCTION public.verify_employee_invitation(token_input TEXT)
RETURNS TABLE (
    employee_id TEXT,
    email TEXT,
    full_name TEXT,
    is_valid BOOLEAN,
    rejection_reason TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        e.id AS employee_id,
        e.email,
        COALESCE(e.full_name, e.name) AS full_name,
        CASE 
            WHEN e.id IS NULL THEN false
            WHEN e.account_status != 'invitation_pending' THEN false
            WHEN e.invitation_expires_at < NOW() THEN false
            ELSE true
        END AS is_valid,
        CASE
            WHEN e.id IS NULL THEN 'INVALID_TOKEN'
            WHEN e.account_status != 'invitation_pending' THEN 'ALREADY_ACTIVATED'
            WHEN e.invitation_expires_at < NOW() THEN 'TOKEN_EXPIRED'
            ELSE 'OK'
        END AS rejection_reason
    FROM public.employees e
    WHERE e.invitation_token = token_input
    LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Ensure employee_permissions table foreign key and indexing
CREATE TABLE IF NOT EXISTS public.employee_permissions (
    id TEXT PRIMARY KEY,
    employee_id TEXT REFERENCES public.employees(id) ON DELETE CASCADE,
    permissions JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_emp_permissions_emp_id ON public.employee_permissions(employee_id);

-- 7. Ensure employee_activity_logs audit trail schema
CREATE TABLE IF NOT EXISTS public.employee_activity_logs (
    id TEXT PRIMARY KEY,
    employee_id TEXT,
    employee_name TEXT,
    employee_email TEXT,
    action TEXT NOT NULL,
    module TEXT,
    entity_type TEXT,
    entity_id TEXT,
    status TEXT DEFAULT 'success',
    details JSONB DEFAULT '{}'::jsonb,
    metadata JSONB DEFAULT '{}'::jsonb,
    ip_address TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_emp_activity_created_at ON public.employee_activity_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_emp_activity_employee_id ON public.employee_activity_logs(employee_id);
CREATE INDEX IF NOT EXISTS idx_emp_activity_action ON public.employee_activity_logs(action);

SELECT '008_employee_management_workflow migration ready.' AS status;
