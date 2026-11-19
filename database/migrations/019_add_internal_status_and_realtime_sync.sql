-- ==============================================================================
-- SALBEAU PRODUCTION MIGRATION 019: ADD INTERNAL_STATUS AND REALTIME SYNC
-- File: database/migrations/019_add_internal_status_and_realtime_sync.sql
-- ==============================================================================

-- 1. Ensure internal_status column exists on public.orders
ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS internal_status TEXT DEFAULT 'pending';

-- 2. Create index for fast status lookups
CREATE INDEX IF NOT EXISTS idx_orders_internal_status ON public.orders(internal_status);

-- 3. Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';

SELECT '019_add_internal_status_and_realtime_sync migration applied successfully' AS status;
