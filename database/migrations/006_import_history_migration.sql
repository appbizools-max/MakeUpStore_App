-- ==============================================================================
-- SALBEAU E-COMMERCE & ADMIN PLATFORM
-- MIGRATION 006: BULK IMPORT HISTORY & AUDIT TRAIL
-- PostgreSQL / Supabase
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.import_history (
    id TEXT PRIMARY KEY,
    filename TEXT NOT NULL,
    file_size INTEGER DEFAULT 0,
    total_rows INTEGER DEFAULT 0,
    created_count INTEGER DEFAULT 0,
    updated_count INTEGER DEFAULT 0,
    failed_count INTEGER DEFAULT 0,
    status TEXT DEFAULT 'completed',
    mode TEXT DEFAULT 'create_and_update',
    error_summary JSONB DEFAULT '[]'::jsonb,
    admin_id TEXT,
    admin_name TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for chronological audit inspection
CREATE INDEX IF NOT EXISTS idx_import_history_created_at ON public.import_history(created_at DESC);

-- Enable Row Level Security
ALTER TABLE public.import_history ENABLE ROW LEVEL SECURITY;

-- Allow authenticated reads and inserts
CREATE POLICY "Allow authenticated read import_history"
ON public.import_history FOR SELECT
USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated insert import_history"
ON public.import_history FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow public read import_history fallback"
ON public.import_history FOR SELECT
USING (true);
