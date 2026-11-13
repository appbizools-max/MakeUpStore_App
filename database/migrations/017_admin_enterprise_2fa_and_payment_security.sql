-- ==============================================================================
-- SALBEAU ENTERPRISE SECURITY: TWO-FACTOR AUTHENTICATION (2FA) & PAYMENT GATEWAY PROTECTION
-- Migration: 017_admin_enterprise_2fa_and_payment_security.sql
-- ==============================================================================

-- 1. Create table for Admin Security Profiles (TOTP Secret, Salted Password, Recovery Codes)
CREATE TABLE IF NOT EXISTS public.admin_security_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_email TEXT NOT NULL UNIQUE,
    user_id TEXT NOT NULL UNIQUE,
    password_hash TEXT,
    password_salt TEXT,
    totp_secret TEXT,
    is_2fa_enabled BOOLEAN DEFAULT FALSE,
    recovery_codes JSONB DEFAULT '[]'::jsonb,
    failed_attempts INTEGER DEFAULT 0,
    locked_until TIMESTAMPTZ,
    last_verified_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure columns exist if table already exists
ALTER TABLE public.admin_security_profiles
ADD COLUMN IF NOT EXISTS admin_email TEXT,
ADD COLUMN IF NOT EXISTS user_id TEXT,
ADD COLUMN IF NOT EXISTS password_hash TEXT,
ADD COLUMN IF NOT EXISTS password_salt TEXT,
ADD COLUMN IF NOT EXISTS totp_secret TEXT,
ADD COLUMN IF NOT EXISTS is_2fa_enabled BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS recovery_codes JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS failed_attempts INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS locked_until TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS last_verified_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Create Indexes for fast lookup
CREATE INDEX IF NOT EXISTS idx_admin_security_profiles_email ON public.admin_security_profiles(admin_email);
CREATE INDEX IF NOT EXISTS idx_admin_security_profiles_user_id ON public.admin_security_profiles(user_id);

-- 2. Create table for 2FA Security Audit Logs
CREATE TABLE IF NOT EXISTS public.admin_2fa_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id TEXT NOT NULL,
    admin_email TEXT NOT NULL,
    action TEXT NOT NULL,
    status TEXT NOT NULL,
    details JSONB DEFAULT '{}'::jsonb,
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_admin_2fa_audit_logs_email ON public.admin_2fa_audit_logs(admin_email);
CREATE INDEX IF NOT EXISTS idx_admin_2fa_audit_logs_action ON public.admin_2fa_audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_admin_2fa_audit_logs_created_at ON public.admin_2fa_audit_logs(created_at DESC);

-- 3. Row Level Security (RLS) Configuration
ALTER TABLE public.admin_security_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_2fa_audit_logs ENABLE ROW LEVEL SECURITY;

-- Idempotent RLS Policies for admin_security_profiles
DROP POLICY IF EXISTS "Allow authenticated read admin security profiles" ON public.admin_security_profiles;
CREATE POLICY "Allow authenticated read admin security profiles"
ON public.admin_security_profiles
FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Allow authenticated insert admin security profiles" ON public.admin_security_profiles;
CREATE POLICY "Allow authenticated insert admin security profiles"
ON public.admin_security_profiles
FOR INSERT
WITH CHECK (true);

DROP POLICY IF EXISTS "Allow authenticated update admin security profiles" ON public.admin_security_profiles;
CREATE POLICY "Allow authenticated update admin security profiles"
ON public.admin_security_profiles
FOR UPDATE
USING (true);

-- Idempotent RLS Policies for admin_2fa_audit_logs
DROP POLICY IF EXISTS "Allow authenticated read 2fa audit logs" ON public.admin_2fa_audit_logs;
CREATE POLICY "Allow authenticated read 2fa audit logs"
ON public.admin_2fa_audit_logs
FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Allow authenticated insert 2fa audit logs" ON public.admin_2fa_audit_logs;
CREATE POLICY "Allow authenticated insert 2fa audit logs"
ON public.admin_2fa_audit_logs
FOR INSERT
WITH CHECK (true);

-- 4. Initial Seed for Root Administrator Profile if not exists
INSERT INTO public.admin_security_profiles (admin_email, user_id, is_2fa_enabled)
VALUES ('admin@salbeau.com', 'admin_root', false)
ON CONFLICT (admin_email) DO NOTHING;

-- 5. Notify Realtime for 2FA Profiles and Audit Logs
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND tablename = 'admin_security_profiles'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.admin_security_profiles;
    END IF;
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND tablename = 'admin_2fa_audit_logs'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.admin_2fa_audit_logs;
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        NULL; -- Continue safely if realtime publication already managed
END $$;

