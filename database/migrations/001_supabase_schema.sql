-- ==============================================================================
-- SALBEAU E-COMMERCE & ADMIN PLATFORM
-- SAFE MASTER MIGRATION / SCHEMA FIX
-- PostgreSQL / Supabase
-- ==============================================================================

-- ==============================================================================
-- 1. USERS
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    full_name TEXT,
    phone TEXT,
    email TEXT,
    role TEXT DEFAULT 'general',
    business_name TEXT,
    branch TEXT DEFAULT 'Visakhapatnam Branch',
    city TEXT,
    state TEXT,
    pincode TEXT,
    verification_status TEXT DEFAULT 'not_submitted',
    b2b_verified BOOLEAN DEFAULT false,
    verified_at TIMESTAMPTZ,
    verified_by TEXT,
    rejection_reason TEXT,
    cancellation_count INTEGER DEFAULT 0,
    last_active TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS name TEXT,
ADD COLUMN IF NOT EXISTS full_name TEXT,
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS email TEXT,
ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'general',
ADD COLUMN IF NOT EXISTS business_name TEXT,
ADD COLUMN IF NOT EXISTS branch TEXT DEFAULT 'Visakhapatnam Branch',
ADD COLUMN IF NOT EXISTS city TEXT,
ADD COLUMN IF NOT EXISTS state TEXT,
ADD COLUMN IF NOT EXISTS pincode TEXT,
ADD COLUMN IF NOT EXISTS verification_status TEXT DEFAULT 'not_submitted',
ADD COLUMN IF NOT EXISTS b2b_verified BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS verified_by TEXT,
ADD COLUMN IF NOT EXISTS rejection_reason TEXT,
ADD COLUMN IF NOT EXISTS cancellation_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_active TIMESTAMPTZ DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();


-- ==============================================================================
-- 2. CATEGORIES
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.categories (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    icon TEXT,
    image TEXT,
    color TEXT,
    sort_order INTEGER DEFAULT 0,
    enabled BOOLEAN DEFAULT true,
    subcategories JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.categories
ADD COLUMN IF NOT EXISTS name TEXT,
ADD COLUMN IF NOT EXISTS icon TEXT,
ADD COLUMN IF NOT EXISTS image TEXT,
ADD COLUMN IF NOT EXISTS color TEXT,
ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS enabled BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS subcategories JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();


-- ==============================================================================
-- 3. BRANDS
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.brands (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    logo TEXT,
    enabled BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.brands
ADD COLUMN IF NOT EXISTS name TEXT,
ADD COLUMN IF NOT EXISTS logo TEXT,
ADD COLUMN IF NOT EXISTS enabled BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();


-- ==============================================================================
-- 4. PRODUCTS
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.products (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    brand_id TEXT,
    brand_name TEXT,
    category TEXT,
    subcategory TEXT,
    variant_type TEXT,
    mrp NUMERIC(10,2) DEFAULT 0,
    general_price NUMERIC(10,2),
    salon_price NUMERIC(10,2),
    artist_price NUMERIC(10,2),
    beautician_price NUMERIC(10,2),
    stock INTEGER DEFAULT 0,
    image TEXT,
    images JSONB DEFAULT '[]'::jsonb,
    shades JSONB DEFAULT '[]'::jsonb,
    quantity_tiers JSONB DEFAULT '[]'::jsonb,
    barcode TEXT,
    description TEXT,
    how_to_use TEXT,
    specifications JSONB DEFAULT '{}'::jsonb,
    additional_info JSONB DEFAULT '{}'::jsonb,
    key_points JSONB DEFAULT '[]'::jsonb,
    search_keywords JSONB DEFAULT '[]'::jsonb,
    enabled BOOLEAN DEFAULT true,
    status TEXT DEFAULT 'published',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS name TEXT,
ADD COLUMN IF NOT EXISTS brand_id TEXT,
ADD COLUMN IF NOT EXISTS brand_name TEXT,
ADD COLUMN IF NOT EXISTS category TEXT,
ADD COLUMN IF NOT EXISTS subcategory TEXT,
ADD COLUMN IF NOT EXISTS variant_type TEXT,
ADD COLUMN IF NOT EXISTS mrp NUMERIC(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS general_price NUMERIC(10,2),
ADD COLUMN IF NOT EXISTS salon_price NUMERIC(10,2),
ADD COLUMN IF NOT EXISTS artist_price NUMERIC(10,2),
ADD COLUMN IF NOT EXISTS beautician_price NUMERIC(10,2),
ADD COLUMN IF NOT EXISTS stock INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS image TEXT,
ADD COLUMN IF NOT EXISTS images JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS shades JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS quantity_tiers JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS barcode TEXT,
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS how_to_use TEXT,
ADD COLUMN IF NOT EXISTS specifications JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS additional_info JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS key_points JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS search_keywords JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS enabled BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'published',
ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();


-- ==============================================================================
-- 5. ORDERS
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.orders (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    user_name TEXT NOT NULL,
    phone TEXT,
    avatar TEXT,
    user_role TEXT DEFAULT 'general',
    branch TEXT DEFAULT 'Visakhapatnam Branch',
    delivery_type TEXT,
    delivery_address TEXT,
    total_amount NUMERIC(10,2) DEFAULT 0,
    item_description TEXT,
    status TEXT DEFAULT 'placed',
    rejection_reason TEXT,
    placed_at TEXT,
    date TIMESTAMPTZ DEFAULT NOW(),
    items JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS user_id TEXT,
ADD COLUMN IF NOT EXISTS user_name TEXT,
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS avatar TEXT,
ADD COLUMN IF NOT EXISTS user_role TEXT DEFAULT 'general',
ADD COLUMN IF NOT EXISTS branch TEXT DEFAULT 'Visakhapatnam Branch',
ADD COLUMN IF NOT EXISTS delivery_type TEXT,
ADD COLUMN IF NOT EXISTS delivery_address TEXT,
ADD COLUMN IF NOT EXISTS total_amount NUMERIC(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS item_description TEXT,
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'placed',
ADD COLUMN IF NOT EXISTS rejection_reason TEXT,
ADD COLUMN IF NOT EXISTS placed_at TEXT,
ADD COLUMN IF NOT EXISTS date TIMESTAMPTZ DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS items JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();


-- ==============================================================================
-- 6. B2B VERIFICATIONS
-- ==============================================================================

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
    admin_notes TEXT,
    submitted_at TIMESTAMPTZ DEFAULT NOW(),
    reviewed_at TIMESTAMPTZ,
    reviewed_by TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.b2b_verifications
ADD COLUMN IF NOT EXISTS user_id TEXT,
ADD COLUMN IF NOT EXISTS name TEXT,
ADD COLUMN IF NOT EXISTS professional_name TEXT,
ADD COLUMN IF NOT EXISTS business_name TEXT,
ADD COLUMN IF NOT EXISTS role TEXT,
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS email TEXT,
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS city TEXT,
ADD COLUMN IF NOT EXISTS state TEXT,
ADD COLUMN IF NOT EXISTS pincode TEXT,
ADD COLUMN IF NOT EXISTS experience TEXT,
ADD COLUMN IF NOT EXISTS gstin TEXT,
ADD COLUMN IF NOT EXISTS registration_number TEXT,
ADD COLUMN IF NOT EXISTS website_or_social_link TEXT,
ADD COLUMN IF NOT EXISTS verification_status TEXT DEFAULT 'submitted',
ADD COLUMN IF NOT EXISTS b2b_verified BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS rejection_reason TEXT,
ADD COLUMN IF NOT EXISTS resubmission_notes TEXT,
ADD COLUMN IF NOT EXISTS admin_notes TEXT,
ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMPTZ DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS reviewed_by TEXT,
ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();


-- ==============================================================================
-- 7. VERIFICATION DOCUMENTS
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.verification_documents (
    id TEXT PRIMARY KEY,
    verification_id TEXT,
    type TEXT NOT NULL,
    label TEXT,
    url TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.verification_documents
ADD COLUMN IF NOT EXISTS verification_id TEXT,
ADD COLUMN IF NOT EXISTS type TEXT,
ADD COLUMN IF NOT EXISTS label TEXT,
ADD COLUMN IF NOT EXISTS url TEXT,
ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();


-- ==============================================================================
-- 8. VERIFICATION HISTORY
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.verification_history (
    id TEXT PRIMARY KEY,
    verification_id TEXT,
    action TEXT NOT NULL,
    admin_id TEXT,
    admin_name TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.verification_history
ADD COLUMN IF NOT EXISTS verification_id TEXT,
ADD COLUMN IF NOT EXISTS action TEXT,
ADD COLUMN IF NOT EXISTS admin_id TEXT,
ADD COLUMN IF NOT EXISTS admin_name TEXT,
ADD COLUMN IF NOT EXISTS notes TEXT,
ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();


-- ==============================================================================
-- 9. CUSTOMER SEARCH REQUESTS
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.customer_search_requests (
    id TEXT PRIMARY KEY,
    query TEXT NOT NULL,
    normalized_query TEXT NOT NULL,
    barcode TEXT,
    is_found BOOLEAN DEFAULT true,
    matched_count INTEGER DEFAULT 0,
    matched_products JSONB DEFAULT '[]'::jsonb,
    search_count INTEGER DEFAULT 1,
    status TEXT DEFAULT 'pending',
    notes TEXT,
    user_id TEXT,
    user_name TEXT,
    user_phone TEXT,
    user_role TEXT DEFAULT 'Customer',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    latest_searched_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.customer_search_requests
ADD COLUMN IF NOT EXISTS query TEXT,
ADD COLUMN IF NOT EXISTS normalized_query TEXT,
ADD COLUMN IF NOT EXISTS barcode TEXT,
ADD COLUMN IF NOT EXISTS is_found BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS matched_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS matched_products JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS search_count INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS notes TEXT,
ADD COLUMN IF NOT EXISTS user_id TEXT,
ADD COLUMN IF NOT EXISTS user_name TEXT,
ADD COLUMN IF NOT EXISTS user_phone TEXT,
ADD COLUMN IF NOT EXISTS user_role TEXT DEFAULT 'Customer',
ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS latest_searched_at TIMESTAMPTZ DEFAULT NOW();


-- ==============================================================================
-- 10. ABANDONED CARTS
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.abandoned_carts (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    user_name TEXT,
    phone TEXT,
    user_role TEXT DEFAULT 'general',
    items JSONB DEFAULT '[]'::jsonb,
    total_amount NUMERIC(10,2) DEFAULT 0,
    item_count INTEGER DEFAULT 0,
    status TEXT DEFAULT 'abandoned',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.abandoned_carts
ADD COLUMN IF NOT EXISTS user_id TEXT,
ADD COLUMN IF NOT EXISTS user_name TEXT,
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS user_role TEXT DEFAULT 'general',
ADD COLUMN IF NOT EXISTS items JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS total_amount NUMERIC(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS item_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'abandoned',
ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();


-- ==============================================================================
-- 11. EMPLOYEES
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.employees (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT,
    password_hash TEXT,
    role TEXT DEFAULT 'Staff',
    status TEXT DEFAULT 'Active',
    avatar TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.employees
ADD COLUMN IF NOT EXISTS name TEXT,
ADD COLUMN IF NOT EXISTS email TEXT,
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS password_hash TEXT,
ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'Staff',
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'Active',
ADD COLUMN IF NOT EXISTS avatar TEXT,
ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();


-- ==============================================================================
-- 12. EMPLOYEE PERMISSIONS
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.employee_permissions (
    id TEXT PRIMARY KEY,
    employee_id TEXT,
    permissions JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.employee_permissions
ADD COLUMN IF NOT EXISTS employee_id TEXT,
ADD COLUMN IF NOT EXISTS permissions JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();


-- ==============================================================================
-- 13. EMPLOYEE ACTIVITY LOGS
-- ==============================================================================

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

ALTER TABLE public.employee_activity_logs
ADD COLUMN IF NOT EXISTS employee_id TEXT,
ADD COLUMN IF NOT EXISTS employee_name TEXT,
ADD COLUMN IF NOT EXISTS employee_email TEXT,
ADD COLUMN IF NOT EXISTS action TEXT,
ADD COLUMN IF NOT EXISTS module TEXT,
ADD COLUMN IF NOT EXISTS target_id TEXT,
ADD COLUMN IF NOT EXISTS target_name TEXT,
ADD COLUMN IF NOT EXISTS details JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS ip_address TEXT,
ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();


-- ==============================================================================
-- 14. EMPLOYEE STAGED OPERATIONS
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.employee_staged_operations (
    id TEXT PRIMARY KEY,
    employee_id TEXT,
    employee_name TEXT,
    employee_email TEXT,
    operation_type TEXT NOT NULL,
    target_id TEXT,
    target_name TEXT,
    module TEXT,
    old_data JSONB,
    new_data JSONB,
    diff_summary JSONB,
    status TEXT DEFAULT 'PENDING_APPROVAL',
    rejection_reason TEXT,
    submitted_at TIMESTAMPTZ DEFAULT NOW(),
    reviewed_at TIMESTAMPTZ,
    reviewed_by TEXT
);

ALTER TABLE public.employee_staged_operations
ADD COLUMN IF NOT EXISTS employee_id TEXT,
ADD COLUMN IF NOT EXISTS employee_name TEXT,
ADD COLUMN IF NOT EXISTS employee_email TEXT,
ADD COLUMN IF NOT EXISTS operation_type TEXT,
ADD COLUMN IF NOT EXISTS target_id TEXT,
ADD COLUMN IF NOT EXISTS target_name TEXT,
ADD COLUMN IF NOT EXISTS module TEXT,
ADD COLUMN IF NOT EXISTS old_data JSONB,
ADD COLUMN IF NOT EXISTS new_data JSONB,
ADD COLUMN IF NOT EXISTS diff_summary JSONB,
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'PENDING_APPROVAL',
ADD COLUMN IF NOT EXISTS rejection_reason TEXT,
ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMPTZ DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS reviewed_by TEXT;


-- ==============================================================================
-- 15. HOME BANNERS
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.home_banners (
    id TEXT PRIMARY KEY,
    title TEXT,
    subtitle TEXT,
    badge TEXT,
    image_url TEXT,
    mobile_image_url TEXT,
    cta_label TEXT,
    destination_type TEXT,
    destination_id TEXT,
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    start_date TIMESTAMPTZ,
    end_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.home_banners
ADD COLUMN IF NOT EXISTS title TEXT,
ADD COLUMN IF NOT EXISTS subtitle TEXT,
ADD COLUMN IF NOT EXISTS badge TEXT,
ADD COLUMN IF NOT EXISTS image_url TEXT,
ADD COLUMN IF NOT EXISTS mobile_image_url TEXT,
ADD COLUMN IF NOT EXISTS cta_label TEXT,
ADD COLUMN IF NOT EXISTS destination_type TEXT,
ADD COLUMN IF NOT EXISTS destination_id TEXT,
ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS start_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS end_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();


-- ==============================================================================
-- 16. PRICING RULES
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.pricing_rules (
    id TEXT PRIMARY KEY,
    role TEXT NOT NULL,
    discount_percent NUMERIC(5,2) DEFAULT 0,
    min_order_amount NUMERIC(10,2) DEFAULT 0,
    enabled BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.pricing_rules
ADD COLUMN IF NOT EXISTS role TEXT,
ADD COLUMN IF NOT EXISTS discount_percent NUMERIC(5,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS min_order_amount NUMERIC(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS enabled BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();


-- ==============================================================================
-- 17. DEFAULT VALUES FOR ENABLED COLUMNS
-- ==============================================================================

UPDATE public.categories
SET enabled = true
WHERE enabled IS NULL;

UPDATE public.brands
SET enabled = true
WHERE enabled IS NULL;

UPDATE public.products
SET enabled = true
WHERE enabled IS NULL;

UPDATE public.pricing_rules
SET enabled = true
WHERE enabled IS NULL;


-- ==============================================================================
-- 18. INDEXES
-- ==============================================================================

CREATE INDEX IF NOT EXISTS idx_users_role
ON public.users(role);

CREATE INDEX IF NOT EXISTS idx_users_verification
ON public.users(verification_status, b2b_verified);

CREATE INDEX IF NOT EXISTS idx_users_phone
ON public.users(phone);


CREATE INDEX IF NOT EXISTS idx_categories_order
ON public.categories(sort_order);

CREATE INDEX IF NOT EXISTS idx_categories_enabled
ON public.categories(enabled);


CREATE INDEX IF NOT EXISTS idx_brands_order
ON public.brands(sort_order);

CREATE INDEX IF NOT EXISTS idx_brands_enabled
ON public.brands(enabled);


CREATE INDEX IF NOT EXISTS idx_products_category
ON public.products(category);

CREATE INDEX IF NOT EXISTS idx_products_brand
ON public.products(brand_id);

CREATE INDEX IF NOT EXISTS idx_products_barcode
ON public.products(barcode);

CREATE INDEX IF NOT EXISTS idx_products_enabled
ON public.products(enabled, status);


CREATE INDEX IF NOT EXISTS idx_orders_user_id
ON public.orders(user_id);

CREATE INDEX IF NOT EXISTS idx_orders_status
ON public.orders(status);

CREATE INDEX IF NOT EXISTS idx_orders_date
ON public.orders(date DESC);


CREATE INDEX IF NOT EXISTS idx_b2b_verif_role
ON public.b2b_verifications(role);

CREATE INDEX IF NOT EXISTS idx_b2b_verif_status
ON public.b2b_verifications(verification_status);

CREATE INDEX IF NOT EXISTS idx_b2b_verif_user_id
ON public.b2b_verifications(user_id);


CREATE INDEX IF NOT EXISTS idx_verif_docs_verif_id
ON public.verification_documents(verification_id);


CREATE INDEX IF NOT EXISTS idx_verif_hist_verif_id
ON public.verification_history(verification_id);


CREATE INDEX IF NOT EXISTS idx_search_requests_norm
ON public.customer_search_requests(normalized_query);

CREATE INDEX IF NOT EXISTS idx_search_requests_found
ON public.customer_search_requests(is_found);


CREATE INDEX IF NOT EXISTS idx_abandoned_carts_status
ON public.abandoned_carts(status);


CREATE INDEX IF NOT EXISTS idx_emp_permissions_emp_id
ON public.employee_permissions(employee_id);


CREATE INDEX IF NOT EXISTS idx_emp_activity_created_at
ON public.employee_activity_logs(created_at DESC);


CREATE INDEX IF NOT EXISTS idx_staged_ops_status
ON public.employee_staged_operations(status);


CREATE INDEX IF NOT EXISTS idx_home_banners_order
ON public.home_banners(display_order);


CREATE INDEX IF NOT EXISTS idx_pricing_rules_role
ON public.pricing_rules(role);

CREATE INDEX IF NOT EXISTS idx_pricing_rules_enabled
ON public.pricing_rules(enabled);


-- ==============================================================================
-- 19. ENABLE RLS
-- ==============================================================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.b2b_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.verification_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.verification_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_search_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.abandoned_carts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_staged_operations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.home_banners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pricing_rules ENABLE ROW LEVEL SECURITY;


-- ==============================================================================
-- 20. SAFE RLS POLICIES
-- ==============================================================================

DO $$
DECLARE
    tbl TEXT;
    policy_name TEXT;
BEGIN

    FOR tbl IN
        SELECT unnest(ARRAY[
            'users',
            'categories',
            'brands',
            'products',
            'orders',
            'b2b_verifications',
            'verification_documents',
            'verification_history',
            'customer_search_requests',
            'abandoned_carts',
            'employees',
            'employee_permissions',
            'employee_activity_logs',
            'employee_staged_operations',
            'home_banners',
            'pricing_rules'
        ])
    LOOP

        policy_name := 'Allow all for ' || tbl;

        EXECUTE format(
            'DROP POLICY IF EXISTS %I ON public.%I',
            policy_name,
            tbl
        );

        EXECUTE format(
            'CREATE POLICY %I
             ON public.%I
             FOR ALL
             USING (true)
             WITH CHECK (true)',
            policy_name,
            tbl
        );

    END LOOP;

END $$;


-- ==============================================================================
-- 21. SUPABASE REALTIME
-- ==============================================================================

DO $$
BEGIN

    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.users;
    EXCEPTION WHEN duplicate_object THEN
        NULL;
    END;

    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.products;
    EXCEPTION WHEN duplicate_object THEN
        NULL;
    END;

    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
    EXCEPTION WHEN duplicate_object THEN
        NULL;
    END;

    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.categories;
    EXCEPTION WHEN duplicate_object THEN
        NULL;
    END;

    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.brands;
    EXCEPTION WHEN duplicate_object THEN
        NULL;
    END;

    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.b2b_verifications;
    EXCEPTION WHEN duplicate_object THEN
        NULL;
    END;

    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.customer_search_requests;
    EXCEPTION WHEN duplicate_object THEN
        NULL;
    END;

    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.abandoned_carts;
    EXCEPTION WHEN duplicate_object THEN
        NULL;
    END;

    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.employee_staged_operations;
    EXCEPTION WHEN duplicate_object THEN
        NULL;
    END;

END $$;


-- ==============================================================================
-- 22. FINAL VERIFICATION
-- ==============================================================================

SELECT
    table_name,
    column_name,
    data_type
FROM information_schema.columns
WHERE table_schema = 'public'
AND (
    (table_name = 'categories' AND column_name = 'enabled')
    OR
    (table_name = 'brands' AND column_name = 'enabled')
    OR
    (table_name = 'products' AND column_name = 'enabled')
    OR
    (table_name = 'pricing_rules' AND column_name = 'enabled')
)
ORDER BY table_name;