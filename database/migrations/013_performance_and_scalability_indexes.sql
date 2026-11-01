-- ==============================================================================
-- SALBEAU PRODUCTION MIGRATION 013: PERFORMANCE INDEXING & SCALABILITY ENHANCEMENTS
-- Target: 10,000 Concurrent Users & Low-Latency API Queries
-- Safe, idempotent execution: Alters missing columns before creating indexes
-- ==============================================================================

-- 1. PRODUCTS TABLE OPTIMIZATION
-- Ensure trending, featured, and status columns exist before index creation
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS is_trending BOOLEAN DEFAULT FALSE;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS trending_priority INTEGER DEFAULT 0;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT FALSE;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS featured_priority INTEGER DEFAULT 0;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'published';

-- Backfill values from existing additional_info JSONB payload if present
UPDATE public.products 
SET 
  is_trending = COALESCE((additional_info->>'is_trending')::boolean, (additional_info->>'isTrending')::boolean, is_trending, false),
  trending_priority = COALESCE((additional_info->>'trending_priority')::integer, (additional_info->>'trendingPriority')::integer, trending_priority, 0),
  is_featured = COALESCE((additional_info->>'is_featured')::boolean, (additional_info->>'isFeatured')::boolean, is_featured, false),
  featured_priority = COALESCE((additional_info->>'featured_priority')::integer, (additional_info->>'featuredPriority')::integer, featured_priority, 0)
WHERE additional_info IS NOT NULL;

-- Accelerate catalog browsing by category & subcategory with enabled/status filters
CREATE INDEX IF NOT EXISTS idx_products_category_status_enabled 
ON public.products (category, status, enabled);

CREATE INDEX IF NOT EXISTS idx_products_subcategory_status_enabled 
ON public.products (subcategory, status, enabled);

CREATE INDEX IF NOT EXISTS idx_products_created_at_desc 
ON public.products (created_at DESC);

-- Partial index for high-velocity Trending shelf lookups
CREATE INDEX IF NOT EXISTS idx_products_trending_priority 
ON public.products (trending_priority DESC) 
WHERE is_trending IS TRUE;

-- Partial index for Featured shelf lookups
CREATE INDEX IF NOT EXISTS idx_products_featured_priority 
ON public.products (featured_priority DESC) 
WHERE is_featured IS TRUE;

-- Brand catalog filtering
CREATE INDEX IF NOT EXISTS idx_products_brand_name 
ON public.products (brand_name) 
WHERE enabled IS TRUE;


-- 2. SUBCATEGORIES TABLE OPTIMIZATION
-- Accelerate subcategory lookups by parent category
CREATE INDEX IF NOT EXISTS idx_subcategories_category_id 
ON public.subcategories (category_id);

CREATE INDEX IF NOT EXISTS idx_subcategories_sort_order 
ON public.subcategories (sort_order ASC);


-- 3. ORDERS TABLE OPTIMIZATION
-- Customer "My Orders" fast lookup with reverse chronological sort
CREATE INDEX IF NOT EXISTS idx_orders_user_id_date 
ON public.orders (user_id, date DESC);

CREATE INDEX IF NOT EXISTS idx_orders_status_date 
ON public.orders (status, date DESC);

CREATE INDEX IF NOT EXISTS idx_orders_created_at_desc 
ON public.orders (created_at DESC);


-- 4. NOTIFICATIONS TABLE (Ensure table exists, then index)
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT,
    title TEXT,
    message TEXT,
    type TEXT DEFAULT 'general',
    data JSONB DEFAULT '{}'::jsonb,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Unread notification count and user list queries
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread 
ON public.notifications (user_id, is_read, created_at DESC);


-- 5. USERS & B2B VERIFICATIONS OPTIMIZATION
-- Fast authentication & token updates
CREATE INDEX IF NOT EXISTS idx_users_phone 
ON public.users (phone);

CREATE INDEX IF NOT EXISTS idx_users_role_verified 
ON public.users (role, b2b_verified);

CREATE INDEX IF NOT EXISTS idx_users_verification_status 
ON public.users (verification_status);

-- B2B Verification Queue (Correctly targets verification_status)
ALTER TABLE public.b2b_verifications ADD COLUMN IF NOT EXISTS verification_status TEXT DEFAULT 'submitted';
ALTER TABLE public.b2b_verifications ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'submitted';

CREATE INDEX IF NOT EXISTS idx_b2b_verifications_status 
ON public.b2b_verifications (verification_status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_b2b_verifications_user_id 
ON public.b2b_verifications (user_id);