-- ==============================================================================
-- SALBEAU B2B PROFESSIONAL VERIFICATION SYSTEM — COMPREHENSIVE SUPABASE MIGRATION
-- Run this in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/mlhlpslhrvwjasbttghw/sql
-- ==============================================================================

-- 1. B2B Verifications Master Table
CREATE TABLE IF NOT EXISTS public.b2b_verifications (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    name TEXT,
    professional_name TEXT,
    business_name TEXT,
    role TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    address TEXT,
    city TEXT,
    state TEXT,
    pincode TEXT,
    country TEXT DEFAULT 'India',
    location_coords JSONB,
    is_business_address_same BOOLEAN DEFAULT true,
    business_address TEXT,
    business_city TEXT,
    business_state TEXT,
    business_pincode TEXT,
    business_country TEXT DEFAULT 'India',
    business_location_coords JSONB,
    experience TEXT,
    gstin TEXT,
    registration_number TEXT,
    registration_details TEXT,
    website_or_social_link TEXT,
    verification_status TEXT DEFAULT 'submitted',
    b2b_verified BOOLEAN DEFAULT false,
    rejection_reason TEXT,
    resubmission_notes TEXT,
    admin_notes TEXT,
    requested_documents JSONB DEFAULT '[]'::jsonb,
    submitted_at TIMESTAMPTZ DEFAULT NOW(),
    reviewed_at TIMESTAMPTZ,
    reviewed_by TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure all columns exist & constraints are relaxed for existing tables
ALTER TABLE public.b2b_verifications ALTER COLUMN name DROP NOT NULL;
ALTER TABLE public.b2b_verifications ADD COLUMN IF NOT EXISTS professional_name TEXT;
ALTER TABLE public.b2b_verifications ADD COLUMN IF NOT EXISTS business_name TEXT;
ALTER TABLE public.b2b_verifications ADD COLUMN IF NOT EXISTS country TEXT DEFAULT 'India';
ALTER TABLE public.b2b_verifications ADD COLUMN IF NOT EXISTS location_coords JSONB;
ALTER TABLE public.b2b_verifications ADD COLUMN IF NOT EXISTS is_business_address_same BOOLEAN DEFAULT true;
ALTER TABLE public.b2b_verifications ADD COLUMN IF NOT EXISTS business_address TEXT;
ALTER TABLE public.b2b_verifications ADD COLUMN IF NOT EXISTS business_city TEXT;
ALTER TABLE public.b2b_verifications ADD COLUMN IF NOT EXISTS business_state TEXT;
ALTER TABLE public.b2b_verifications ADD COLUMN IF NOT EXISTS business_pincode TEXT;
ALTER TABLE public.b2b_verifications ADD COLUMN IF NOT EXISTS business_country TEXT DEFAULT 'India';
ALTER TABLE public.b2b_verifications ADD COLUMN IF NOT EXISTS business_location_coords JSONB;
ALTER TABLE public.b2b_verifications ADD COLUMN IF NOT EXISTS registration_details TEXT;
ALTER TABLE public.b2b_verifications ADD COLUMN IF NOT EXISTS registration_number TEXT;
ALTER TABLE public.b2b_verifications ADD COLUMN IF NOT EXISTS admin_notes TEXT;
ALTER TABLE public.b2b_verifications ADD COLUMN IF NOT EXISTS requested_documents JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.b2b_verifications ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ;
ALTER TABLE public.b2b_verifications ADD COLUMN IF NOT EXISTS reviewed_by TEXT;

-- 2. Verification Documents & Photographs (With Dual-Column Compatibility)
CREATE TABLE IF NOT EXISTS public.verification_documents (
    id TEXT PRIMARY KEY,
    verification_id TEXT REFERENCES public.b2b_verifications(id) ON DELETE CASCADE,
    user_id TEXT,
    type TEXT,
    document_type TEXT,
    label TEXT,
    file_name TEXT,
    url TEXT,
    file_url TEXT,
    uploaded_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.verification_documents ADD COLUMN IF NOT EXISTS user_id TEXT;
ALTER TABLE public.verification_documents ADD COLUMN IF NOT EXISTS document_type TEXT;
ALTER TABLE public.verification_documents ADD COLUMN IF NOT EXISTS file_name TEXT;
ALTER TABLE public.verification_documents ADD COLUMN IF NOT EXISTS file_url TEXT;
ALTER TABLE public.verification_documents ADD COLUMN IF NOT EXISTS uploaded_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.verification_documents ALTER COLUMN type DROP NOT NULL;
ALTER TABLE public.verification_documents ALTER COLUMN url DROP NOT NULL;

-- 3. Verification Audit & Transition History
CREATE TABLE IF NOT EXISTS public.verification_history (
    id TEXT PRIMARY KEY,
    verification_id TEXT REFERENCES public.b2b_verifications(id) ON DELETE CASCADE,
    user_id TEXT,
    action TEXT NOT NULL,
    previous_status TEXT,
    new_status TEXT,
    reason TEXT,
    admin_id TEXT,
    admin_name TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.verification_history ADD COLUMN IF NOT EXISTS user_id TEXT;
ALTER TABLE public.verification_history ADD COLUMN IF NOT EXISTS previous_status TEXT;
ALTER TABLE public.verification_history ADD COLUMN IF NOT EXISTS new_status TEXT;
ALTER TABLE public.verification_history ADD COLUMN IF NOT EXISTS reason TEXT;

-- 4. In-App Notifications Table
CREATE TABLE IF NOT EXISTS public.notifications (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    target TEXT DEFAULT 'all',
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT DEFAULT 'general',
    data JSONB DEFAULT '{}'::jsonb,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Add b2b_verified flag & business details to users table
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS b2b_verified BOOLEAN DEFAULT false;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS verification_status TEXT DEFAULT 'not_submitted';
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS verified_by TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS verification_approved_at TIMESTAMPTZ;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS verification_rejected_at TIMESTAMPTZ;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS rejection_reason TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS business_name TEXT;

-- 6. Row Level Security & Access Policies
ALTER TABLE public.b2b_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.verification_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.verification_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all access to b2b_verifications" ON public.b2b_verifications;
CREATE POLICY "Allow all access to b2b_verifications" ON public.b2b_verifications FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all access to verification_documents" ON public.verification_documents;
CREATE POLICY "Allow all access to verification_documents" ON public.verification_documents FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all access to verification_history" ON public.verification_history;
CREATE POLICY "Allow all access to verification_history" ON public.verification_history FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all access to notifications" ON public.notifications;
CREATE POLICY "Allow all access to notifications" ON public.notifications FOR ALL USING (true) WITH CHECK (true);

-- 7. Add to Realtime Publication (Idempotent / Safe)
DO $$
BEGIN
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.b2b_verifications;
    EXCEPTION WHEN duplicate_object THEN
        NULL;
    END;

    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.verification_documents;
    EXCEPTION WHEN duplicate_object THEN
        NULL;
    END;

    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.verification_history;
    EXCEPTION WHEN duplicate_object THEN
        NULL;
    END;

    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
    EXCEPTION WHEN duplicate_object THEN
        NULL;
    END;
END $$;

-- 8. Ensure Storage Bucket Exists for Verification Documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('verification-docs', 'verification-docs', true)
ON CONFLICT (id) DO NOTHING;
