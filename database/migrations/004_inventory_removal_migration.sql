-- ==============================================================================
-- SALBEAU MAKEUPSTORE PLATFORM
-- PHASE 2: COMPLETE INVENTORY MANAGEMENT REMOVAL MIGRATION
-- Target: Supabase / PostgreSQL
-- Run in Supabase SQL Editor: https://supabase.com/dashboard/project/mlhlpslhrvwjasbttghw/sql
-- ==============================================================================

-- 1. Ensure Catalog Active/Inactive (enabled) Column is Normalized and Indexed
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS enabled BOOLEAN DEFAULT true;

UPDATE public.products
SET enabled = true
WHERE enabled IS NULL;

-- 2. Index for Catalog Filtering (Without Stock Dependencies)
CREATE INDEX IF NOT EXISTS idx_products_catalog_active
ON public.products(enabled, status);

-- 3. Safely Nullify / Deprecate the legacy stock column
-- Note: Leaving the column nullable prevents breaking existing third-party connectors
-- while removing all constraints, triggers, and mandatory stock requirements.
ALTER TABLE public.products
ALTER COLUMN stock DROP NOT NULL,
ALTER COLUMN stock DROP DEFAULT;

-- 4. Verify Zero Stock Triggers on products
DO $$
DECLARE
    trg RECORD;
BEGIN
    FOR trg IN 
        SELECT trigger_name 
        FROM information_schema.triggers 
        WHERE event_object_table = 'products' 
        AND trigger_name ILIKE '%stock%'
    LOOP
        EXECUTE format('DROP TRIGGER IF EXISTS %I ON public.products', trg.trigger_name);
    END LOOP;
END $$;

-- 5. Verification Check: Catalog status active and stock decoupled
SELECT 
    column_name, 
    data_type, 
    is_nullable 
FROM information_schema.columns 
WHERE table_name = 'products' 
AND column_name IN ('enabled', 'status', 'stock')
ORDER BY column_name;
