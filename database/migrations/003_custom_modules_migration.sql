-- ==============================================================================
-- SALBEAU E-COMMERCE & ADMIN PANEL DATABASE EXTENSION MIGRATION
-- Run this SQL in your Supabase SQL Editor: https://supabase.com/dashboard/project/mlhlpslhrvwjasbttghw/sql
-- ==============================================================================

-- 1. Customer Search Tracking Table (Tracks 100% of searches: Found and Not Found)
CREATE TABLE IF NOT EXISTS public.customer_search_requests (
    id TEXT PRIMARY KEY,
    query TEXT NOT NULL,
    normalized_query TEXT NOT NULL,
    barcode TEXT,
    is_found BOOLEAN DEFAULT true,
    matched_count INTEGER DEFAULT 0,
    matched_products JSONB DEFAULT '[]'::jsonb,
    search_count INTEGER DEFAULT 1,
    status TEXT DEFAULT 'pending', -- 'pending', 'resolved', 'ignored'
    notes TEXT,
    user_id TEXT,
    user_name TEXT,
    user_phone TEXT,
    user_role TEXT DEFAULT 'Customer',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    latest_searched_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_search_requests_norm_query ON public.customer_search_requests(normalized_query);
CREATE INDEX IF NOT EXISTS idx_search_requests_is_found ON public.customer_search_requests(is_found);
CREATE INDEX IF NOT EXISTS idx_search_requests_latest_at ON public.customer_search_requests(latest_searched_at DESC);

-- 2. Employees Table (Separate login accounts for staff with role & status)
CREATE TABLE IF NOT EXISTS public.employees (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT,
    password_hash TEXT,
    role TEXT DEFAULT 'Staff',
    status TEXT DEFAULT 'Active', -- 'Active', 'Inactive'
    avatar TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Employee Permissions Table (Granular toggles per employee and module)
CREATE TABLE IF NOT EXISTS public.employee_permissions (
    id TEXT PRIMARY KEY,
    employee_id TEXT REFERENCES public.employees(id) ON DELETE CASCADE,
    permissions JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_emp_permissions_emp_id ON public.employee_permissions(employee_id);

-- 4. Employee Activity Logs Table (Audit Trail for employee actions)
CREATE TABLE IF NOT EXISTS public.employee_activity_logs (
    id TEXT PRIMARY KEY,
    employee_id TEXT,
    employee_name TEXT,
    employee_email TEXT,
    action TEXT NOT NULL,
    module TEXT,
    target_id TEXT,
    target_name TEXT,
    details JSONB DEFAULT '{}'::jsonb,
    ip_address TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_emp_activity_created_at ON public.employee_activity_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_emp_activity_employee ON public.employee_activity_logs(employee_id);

-- 5. Staged Employee Operations Table (Approval Center for edits/deletes requiring Admin approval)
CREATE TABLE IF NOT EXISTS public.employee_staged_operations (
    id TEXT PRIMARY KEY,
    employee_id TEXT,
    employee_name TEXT,
    employee_email TEXT,
    operation_type TEXT NOT NULL, -- 'ADD_PRODUCT', 'UPDATE_PRODUCT', 'DELETE_PRODUCT', 'UPDATE_PRICE', etc.
    target_id TEXT,
    target_name TEXT,
    module TEXT,
    old_data JSONB,
    new_data JSONB,
    diff_summary JSONB,
    status TEXT DEFAULT 'PENDING_APPROVAL', -- 'PENDING_APPROVAL', 'APPROVED', 'REJECTED'
    rejection_reason TEXT,
    submitted_at TIMESTAMPTZ DEFAULT NOW(),
    reviewed_at TIMESTAMPTZ,
    reviewed_by TEXT
);

CREATE INDEX IF NOT EXISTS idx_staged_ops_status ON public.employee_staged_operations(status);
CREATE INDEX IF NOT EXISTS idx_staged_ops_submitted_at ON public.employee_staged_operations(submitted_at DESC);

-- Enable Row Level Security & Allow Public Read/Write for Anon & Service Roles
ALTER TABLE public.customer_search_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_staged_operations ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
    DROP POLICY IF EXISTS "Public access to customer_search_requests" ON public.customer_search_requests;
    CREATE POLICY "Public access to customer_search_requests" ON public.customer_search_requests FOR ALL USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "Public access to employees" ON public.employees;
    CREATE POLICY "Public access to employees" ON public.employees FOR ALL USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "Public access to employee_permissions" ON public.employee_permissions;
    CREATE POLICY "Public access to employee_permissions" ON public.employee_permissions FOR ALL USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "Public access to employee_activity_logs" ON public.employee_activity_logs;
    CREATE POLICY "Public access to employee_activity_logs" ON public.employee_activity_logs FOR ALL USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "Public access to employee_staged_operations" ON public.employee_staged_operations;
    CREATE POLICY "Public access to employee_staged_operations" ON public.employee_staged_operations FOR ALL USING (true) WITH CHECK (true);
END $$;
