-- ==============================================================================
-- SALBEAU B2B PROFESSIONAL VERIFICATION SYSTEM — SUPABASE MIGRATION
-- Run this in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/mlhlpslhrvwjasbttghw/sql
-- ==============================================================================

-- 1. B2B Verifications Master Table
CREATE TABLE IF NOT EXISTS public.b2b_verifications (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    name TEXT NOT NULL,
    professional_name TEXT,
    business_name TEXT,
    role TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    address TEXT,
    city TEXT,
    state TEXT,
    pincode TEXT,
    experience TEXT,
    gstin TEXT,
    registration_number TEXT,
    website_or_social_link TEXT,
    verification_status TEXT DEFAULT 'submitted',
    b2b_verified BOOLEAN DEFAULT false,
    rejection_reason TEXT,
    resubmission_notes TEXT,
    submitted_at TIMESTAMPTZ DEFAULT NOW(),
    reviewed_at TIMESTAMPTZ,
    reviewed_by TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Verification Documents & Photographs
CREATE TABLE IF NOT EXISTS public.verification_documents (
    id TEXT PRIMARY KEY,
    verification_id TEXT REFERENCES public.b2b_verifications(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    label TEXT,
    url TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Verification Audit & Transition History
CREATE TABLE IF NOT EXISTS public.verification_history (
    id TEXT PRIMARY KEY,
    verification_id TEXT REFERENCES public.b2b_verifications(id) ON DELETE CASCADE,
    action TEXT NOT NULL,
    admin_id TEXT,
    admin_name TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Add b2b_verified flag & business details to users table if not already present
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS b2b_verified BOOLEAN DEFAULT false;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS verified_by TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- 5. Row Level Security & Access Policies
ALTER TABLE public.b2b_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.verification_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.verification_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all access to b2b_verifications" ON public.b2b_verifications;
CREATE POLICY "Allow all access to b2b_verifications" ON public.b2b_verifications FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all access to verification_documents" ON public.verification_documents;
CREATE POLICY "Allow all access to verification_documents" ON public.verification_documents FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all access to verification_history" ON public.verification_history;
CREATE POLICY "Allow all access to verification_history" ON public.verification_history FOR ALL USING (true) WITH CHECK (true);

-- 6. Add to Realtime Publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.b2b_verifications;
