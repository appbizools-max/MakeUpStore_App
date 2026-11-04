-- ==============================================================================
-- SALBEAU PRODUCTION MIGRATION 015: MASTER DATA CONTROL RBAC & INTEGRITY
-- Enforces Database-Level Restrictions: Only Authorized Administrators Can Mutate
-- Master Data (Brands, Categories, Subcategories). Employees Have Read-Only Access.
-- ==============================================================================

-- 1. Enable RLS on all Master Data Tables
ALTER TABLE IF EXISTS public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.subcategories ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.brands ENABLE ROW LEVEL SECURITY;

-- 2. Clean Up and Re-Establish Read-Only Public/Employee Access (SELECT)
DROP POLICY IF EXISTS "Allow public read categories" ON public.categories;
CREATE POLICY "Allow public read categories"
ON public.categories FOR SELECT
TO anon, authenticated
USING (true);

DROP POLICY IF EXISTS "Allow public read subcategories" ON public.subcategories;
CREATE POLICY "Allow public read subcategories"
ON public.subcategories FOR SELECT
TO anon, authenticated
USING (true);

DROP POLICY IF EXISTS "Allow public read brands" ON public.brands;
CREATE POLICY "Allow public read brands"
ON public.brands FOR SELECT
TO anon, authenticated
USING (true);

-- 3. Strict Admin-Only Mutation Policies (INSERT, UPDATE, DELETE)
DROP POLICY IF EXISTS "Admin full mutate categories" ON public.categories;
CREATE POLICY "Admin full mutate categories"
ON public.categories FOR ALL
TO authenticated
USING (
    (COALESCE(auth.jwt() -> 'app_metadata' ->> 'role', auth.jwt() ->> 'role')) IN ('admin', 'superadmin', 'service_role')
)
WITH CHECK (
    (COALESCE(auth.jwt() -> 'app_metadata' ->> 'role', auth.jwt() ->> 'role')) IN ('admin', 'superadmin', 'service_role')
);

DROP POLICY IF EXISTS "Admin full mutate subcategories" ON public.subcategories;
CREATE POLICY "Admin full mutate subcategories"
ON public.subcategories FOR ALL
TO authenticated
USING (
    (COALESCE(auth.jwt() -> 'app_metadata' ->> 'role', auth.jwt() ->> 'role')) IN ('admin', 'superadmin', 'service_role')
)
WITH CHECK (
    (COALESCE(auth.jwt() -> 'app_metadata' ->> 'role', auth.jwt() ->> 'role')) IN ('admin', 'superadmin', 'service_role')
);

DROP POLICY IF EXISTS "Admin full mutate brands" ON public.brands;
CREATE POLICY "Admin full mutate brands"
ON public.brands FOR ALL
TO authenticated
USING (
    (COALESCE(auth.jwt() -> 'app_metadata' ->> 'role', auth.jwt() ->> 'role')) IN ('admin', 'superadmin', 'service_role')
)
WITH CHECK (
    (COALESCE(auth.jwt() -> 'app_metadata' ->> 'role', auth.jwt() ->> 'role')) IN ('admin', 'superadmin', 'service_role')
);

-- 4. Audit Log Function for Master Data Access
COMMENT ON TABLE public.brands IS 'Master Data: Brands. Strictly writable only by Admins. Readable by Employees and Customers.';
COMMENT ON TABLE public.categories IS 'Master Data: Main Categories. Strictly writable only by Admins. Readable by Employees and Customers.';
COMMENT ON TABLE public.subcategories IS 'Master Data: Subcategories. Strictly writable only by Admins. Readable by Employees and Customers.';
