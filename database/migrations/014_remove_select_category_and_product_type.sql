-- ==============================================================================
-- SALBEAU PRODUCTION MIGRATION 014: REMOVAL OF SELECT_CATEGORY & PRODUCT_TYPE
-- Strictly preserves 2-Level Taxonomy: CATEGORY -> SUBCATEGORY
-- Safe & Idempotent: Drops obsolete columns/tables if they exist without breaking existing products
-- ==============================================================================

DO $$
BEGIN
    -- 1. Remove obsolete columns from products table if they exist
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'products' AND column_name = 'select_category'
    ) THEN
        ALTER TABLE public.products DROP COLUMN select_category;
    END IF;

    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'products' AND column_name = 'select_category_id'
    ) THEN
        ALTER TABLE public.products DROP COLUMN select_category_id;
    END IF;

    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'products' AND column_name = 'product_type'
    ) THEN
        ALTER TABLE public.products DROP COLUMN product_type;
    END IF;

    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'products' AND column_name = 'product_type_id'
    ) THEN
        ALTER TABLE public.products DROP COLUMN product_type_id;
    END IF;

    -- 2. Drop obsolete Level 3 tables if they exist
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'product_types'
    ) THEN
        DROP TABLE public.product_types CASCADE;
    END IF;

    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'select_categories'
    ) THEN
        DROP TABLE public.select_categories CASCADE;
    END IF;

    -- 3. Clean up obsolete JSON keys from additional_info in products table
    UPDATE public.products
    SET additional_info = additional_info - 'select_category' - 'selectCategory' - 'product_type' - 'productType'
    WHERE additional_info IS NOT NULL 
      AND (
        additional_info ? 'select_category' 
        OR additional_info ? 'selectCategory' 
        OR additional_info ? 'product_type' 
        OR additional_info ? 'productType'
      );

END $$;
