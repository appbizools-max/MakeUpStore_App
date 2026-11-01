
-- ============================================================================
-- SALBEAU COSMETICS
-- MIGRATION 012: SECURITY HARDENING (SEC-03 & SEC-04)
-- ============================================================================
-- SEC-03: Private Storage for B2B Verification Documents
-- SEC-04: Row-Level Security for Catalog RBAC and Employee Operations
--
-- FIXES:
--   1. Removed manual ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY.
--   2. Uses trusted app_metadata.role for administrator authorization.
--   3. Casts auth.uid() to TEXT for employee_id comparisons.
--   4. Restricts employee staged-operation access.
--
-- ASSUMPTIONS:
--   employee_staged_operations.employee_id is TEXT.
--   employee_id stores auth.users.id as text.
--   Administrator roles are stored in app_metadata.role.
--
-- IMPORTANT:
--   Review existing policies before deploying to production.
-- ============================================================================


BEGIN;


-- ============================================================================
-- SECTION 1: SEC-03 — PRIVATE VERIFICATION DOCUMENT STORAGE
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1.1 Create or secure the private verification-docs bucket
-- ----------------------------------------------------------------------------

INSERT INTO storage.buckets (
    id,
    name,
    public,
    file_size_limit,
    allowed_mime_types
)
VALUES (
    'verification-docs',
    'verification-docs',
    false,
    10485760,
    ARRAY[
        'image/jpeg',
        'image/png',
        'image/webp',
        'application/pdf'
    ]
)
ON CONFLICT (id)
DO UPDATE SET
    name = EXCLUDED.name,
    public = false,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;


-- ----------------------------------------------------------------------------
-- 1.2 Remove policies created by this migration
-- ----------------------------------------------------------------------------

DROP POLICY IF EXISTS
    "Users can upload own verification docs"
ON storage.objects;

DROP POLICY IF EXISTS
    "Users can view own verification docs"
ON storage.objects;

DROP POLICY IF EXISTS
    "Admins can view all verification docs"
ON storage.objects;


-- ----------------------------------------------------------------------------
-- 1.3 Users can upload documents only to their own folder
--
-- Expected object path:
-- <auth-user-uuid>/<filename>
-- ----------------------------------------------------------------------------

CREATE POLICY "Users can upload own verification docs"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'verification-docs'
    AND (storage.foldername(name))[1] =
        (SELECT auth.uid())::text
);


-- ----------------------------------------------------------------------------
-- 1.4 Users can read their own verification documents
-- ----------------------------------------------------------------------------

CREATE POLICY "Users can view own verification docs"
ON storage.objects
FOR SELECT
TO authenticated
USING (
    bucket_id = 'verification-docs'
    AND (storage.foldername(name))[1] =
        (SELECT auth.uid())::text
);


-- ----------------------------------------------------------------------------
-- 1.5 Administrators can read verification documents
--
-- The administrator role must be assigned through trusted server-side code.
-- ----------------------------------------------------------------------------

CREATE POLICY "Admins can view all verification docs"
ON storage.objects
FOR SELECT
TO authenticated
USING (
    bucket_id = 'verification-docs'
    AND (
        (SELECT auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
    )
);


-- ============================================================================
-- SECTION 2: SEC-04 — ENABLE RLS ON APPLICATION TABLES
-- ============================================================================

ALTER TABLE public.products
    ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.categories
    ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.subcategories
    ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.brands
    ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.employee_staged_operations
    ENABLE ROW LEVEL SECURITY;


-- ============================================================================
-- SECTION 3: PUBLIC CATALOG READ POLICIES
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 3.1 Products
-- ----------------------------------------------------------------------------

DROP POLICY IF EXISTS
    "Allow public read products"
ON public.products;

CREATE POLICY "Allow public read products"
ON public.products
FOR SELECT
TO anon, authenticated
USING (true);


-- ----------------------------------------------------------------------------
-- 3.2 Categories
-- ----------------------------------------------------------------------------

DROP POLICY IF EXISTS
    "Allow public read categories"
ON public.categories;

CREATE POLICY "Allow public read categories"
ON public.categories
FOR SELECT
TO anon, authenticated
USING (true);


-- ----------------------------------------------------------------------------
-- 3.3 Subcategories
-- ----------------------------------------------------------------------------

DROP POLICY IF EXISTS
    "Allow public read subcategories"
ON public.subcategories;

CREATE POLICY "Allow public read subcategories"
ON public.subcategories
FOR SELECT
TO anon, authenticated
USING (true);


-- ----------------------------------------------------------------------------
-- 3.4 Brands
-- ----------------------------------------------------------------------------

DROP POLICY IF EXISTS
    "Allow public read brands"
ON public.brands;

CREATE POLICY "Allow public read brands"
ON public.brands
FOR SELECT
TO anon, authenticated
USING (true);


-- ============================================================================
-- SECTION 4: ADMINISTRATOR-ONLY CATALOG MODIFICATIONS
-- ============================================================================

-- Administrator authorization uses app_metadata.role.
-- Do not trust user_metadata for privileged authorization.


-- ----------------------------------------------------------------------------
-- 4.1 Products
-- ----------------------------------------------------------------------------

DROP POLICY IF EXISTS
    "Admin full mutate products"
ON public.products;

CREATE POLICY "Admin full mutate products"
ON public.products
FOR ALL
TO authenticated
USING (
    (SELECT auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
)
WITH CHECK (
    (SELECT auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
);


-- ----------------------------------------------------------------------------
-- 4.2 Categories
-- ----------------------------------------------------------------------------

DROP POLICY IF EXISTS
    "Admin full mutate categories"
ON public.categories;

CREATE POLICY "Admin full mutate categories"
ON public.categories
FOR ALL
TO authenticated
USING (
    (SELECT auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
)
WITH CHECK (
    (SELECT auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
);


-- ----------------------------------------------------------------------------
-- 4.3 Subcategories
-- ----------------------------------------------------------------------------

DROP POLICY IF EXISTS
    "Admin full mutate subcategories"
ON public.subcategories;

CREATE POLICY "Admin full mutate subcategories"
ON public.subcategories
FOR ALL
TO authenticated
USING (
    (SELECT auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
)
WITH CHECK (
    (SELECT auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
);


-- ----------------------------------------------------------------------------
-- 4.4 Brands
-- ----------------------------------------------------------------------------

DROP POLICY IF EXISTS
    "Admin full mutate brands"
ON public.brands;

CREATE POLICY "Admin full mutate brands"
ON public.brands
FOR ALL
TO authenticated
USING (
    (SELECT auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
)
WITH CHECK (
    (SELECT auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
);


-- ============================================================================
-- SECTION 5: EMPLOYEE STAGED OPERATIONS
-- ============================================================================
-- ASSUMPTION:
-- employee_staged_operations.employee_id is TEXT and contains the
-- authenticated user's UUID as text.
--
-- If the column stores another identifier, adapt these policies.
-- ============================================================================


-- ----------------------------------------------------------------------------
-- 5.1 Remove previous versions of the policies
-- ----------------------------------------------------------------------------

DROP POLICY IF EXISTS
    "Employees can insert staged operations"
ON public.employee_staged_operations;

DROP POLICY IF EXISTS
    "Staff can read staged operations"
ON public.employee_staged_operations;

DROP POLICY IF EXISTS
    "Admins can update staged operations"
ON public.employee_staged_operations;


-- ----------------------------------------------------------------------------
-- 5.2 Employees can insert their own staged operations
-- ----------------------------------------------------------------------------

CREATE POLICY "Employees can insert staged operations"
ON public.employee_staged_operations
FOR INSERT
TO authenticated
WITH CHECK (
    employee_id = (SELECT auth.uid())::text
    AND COALESCE(
        (SELECT auth.jwt() -> 'app_metadata' ->> 'role'),
        ''
    ) IN ('employee', 'admin')
);


-- ----------------------------------------------------------------------------
-- 5.3 Employees can read their own operations.
-- Administrators can read all operations.
-- ----------------------------------------------------------------------------

CREATE POLICY "Staff can read staged operations"
ON public.employee_staged_operations
FOR SELECT
TO authenticated
USING (
    employee_id = (SELECT auth.uid())::text
    OR
    (SELECT auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
);


-- ----------------------------------------------------------------------------
-- 5.4 Only administrators can update staged operations
-- ----------------------------------------------------------------------------

CREATE POLICY "Admins can update staged operations"
ON public.employee_staged_operations
FOR UPDATE
TO authenticated
USING (
    (SELECT auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
)
WITH CHECK (
    (SELECT auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
);


COMMIT;


-- ============================================================================
-- SECTION 6: POST-MIGRATION VERIFICATION
-- ============================================================================
-- Run these queries separately after the migration succeeds.
-- ============================================================================


-- ----------------------------------------------------------------------------
-- 6.1 Verify verification-docs bucket configuration
-- ----------------------------------------------------------------------------

SELECT
    id,
    name,
    public,
    file_size_limit,
    allowed_mime_types
FROM storage.buckets
WHERE id = 'verification-docs';


-- ----------------------------------------------------------------------------
-- 6.2 Verify RLS is enabled on the application tables
-- ----------------------------------------------------------------------------

SELECT
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN (
      'products',
      'categories',
      'subcategories',
      'brands',
      'employee_staged_operations'
  )
ORDER BY tablename;


-- ----------------------------------------------------------------------------
-- 6.3 Verify employee_id column type
-- ----------------------------------------------------------------------------

SELECT
    column_name,
    data_type,
    udt_name
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'employee_staged_operations'
  AND column_name = 'employee_id';


-- ----------------------------------------------------------------------------
-- 6.4 Inspect policies on application and storage tables
-- ----------------------------------------------------------------------------

SELECT
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE (
    schemaname = 'public'
    AND tablename IN (
        'products',
        'categories',
        'subcategories',
        'brands',
        'employee_staged_operations'
    )
)
OR (
    schemaname = 'storage'
    AND tablename = 'objects'
)
ORDER BY
    schemaname,
    tablename,
    policyname;


-- ============================================================================
-- END OF MIGRATION 012
-- ============================================================================

