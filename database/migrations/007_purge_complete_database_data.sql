-- ==============================================================================
-- SALBEAU E-COMMERCE PLATFORM
-- COMPLETE DATABASE PURGE & RESET MIGRATION
-- CAUTION: PERMANENTLY REMOVES ALL USERS, ADMINS, AND DATA RECORDS
-- ==============================================================================

-- 1. Temporarily disable triggers/foreign keys to ensure safe cascade truncate
SET session_replication_role = 'replica';

-- 2. Truncate all tables in public schema
DO $$ 
DECLARE
    r RECORD;
BEGIN
    -- Truncate all known application tables
    TRUNCATE TABLE 
        public.verification_documents,
        public.verification_history,
        public.b2b_verifications,
        public.employee_permissions,
        public.employee_activity_logs,
        public.employee_staged_operations,
        public.employees,
        public.customer_search_requests,
        public.abandoned_carts,
        public.favorites,
        public.notifications,
        public.import_history,
        public.orders,
        public.products,
        public.home_banners,
        public.pricing_rules,
        public.categories,
        public.brands,
        public.users
    CASCADE;

    -- Also truncate any remaining tables in public schema if they exist
    FOR r IN (
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'public' 
          AND tablename NOT IN ('spatial_ref_sys')
    ) LOOP
        EXECUTE 'TRUNCATE TABLE public.' || quote_ident(r.tablename) || ' CASCADE;';
    END LOOP;
END $$;

-- 3. Delete all Supabase Auth accounts and identities
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'auth' AND tablename = 'users') THEN
        DELETE FROM auth.users;
    END IF;
END $$;

-- 4. Re-enable triggers and foreign key constraints
SET session_replication_role = 'DEFAULT';

-- 5. Complete notification
SELECT 'Salbeau complete database purge completed successfully. All users, admins, and transactional data wiped clean.' AS status;
