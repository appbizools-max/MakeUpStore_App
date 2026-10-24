-- ==============================================================================
-- SALBEAU E-COMMERCE & ADMIN PLATFORM
-- COMPLETE DATABASE IMAGE REMOVAL MIGRATION
-- Clears all images across categories, subcategories, products, brands, and banners
-- Hierarchy structure, category names, relationships, and products remain 100% intact
-- ==============================================================================

-- 1. CLEAR CATEGORIES IMAGES & ICONS
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'categories') THEN
        UPDATE public.categories 
        SET 
            image = NULL,
            icon = NULL;

        -- Also strip image properties from embedded subcategories JSONB if present
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'categories' AND column_name = 'subcategories') THEN
            UPDATE public.categories
            SET subcategories = (
                SELECT COALESCE(jsonb_agg(s - 'image' - 'image_url'), '[]'::jsonb)
                FROM jsonb_array_elements(subcategories) s
            )
            WHERE subcategories IS NOT NULL AND jsonb_typeof(subcategories) = 'array' AND jsonb_array_length(subcategories) > 0;
        END IF;
    END IF;
END $$;

-- 2. CLEAR SUBCATEGORIES IMAGES (IF DEDICATED TABLE EXISTS)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'subcategories') THEN
        UPDATE public.subcategories 
        SET image = NULL;
    END IF;
END $$;

-- 3. CLEAR PRODUCT_TYPES / LEAF CATEGORIES IMAGES (IF TABLE EXISTS)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'product_types') THEN
        UPDATE public.product_types 
        SET image = NULL;
    END IF;
END $$;

-- 4. CLEAR PRODUCTS IMAGES & VARIANT SHADE IMAGES
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'products') THEN
        UPDATE public.products 
        SET 
            image = NULL,
            images = '[]'::jsonb;

        -- Strip image/imageUrl from shades JSON array if present
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'products' AND column_name = 'shades') THEN
            UPDATE public.products
            SET shades = (
                SELECT COALESCE(jsonb_agg(sh - 'image' - 'imageUrl'), '[]'::jsonb)
                FROM jsonb_array_elements(shades) sh
            )
            WHERE shades IS NOT NULL AND jsonb_typeof(shades) = 'array' AND jsonb_array_length(shades) > 0;
        END IF;
    END IF;
END $$;

-- 5. CLEAR BRAND LOGOS (EXCLUDING CONFIGURATION RECORDS)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'brands') THEN
        UPDATE public.brands 
        SET logo = NULL
        WHERE id NOT IN ('salbeau_category_subcategory_hierarchy', 'app_category_order_config');
    END IF;
END $$;

-- 6. CLEAN MASTER HIERARCHY CACHE RECORD IN BRANDS TABLE
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM public.brands WHERE id = 'salbeau_category_subcategory_hierarchy') THEN
        BEGIN
            UPDATE public.brands
            SET logo = jsonb_set(
                jsonb_set(
                    jsonb_set(
                        logo::jsonb,
                        '{categories}',
                        (
                            SELECT COALESCE(jsonb_agg(c - 'image' - 'image_url' - 'icon'), '[]'::jsonb)
                            FROM jsonb_array_elements(logo::jsonb->'categories') c
                        )
                    ),
                    '{subcategories}',
                    (
                        SELECT COALESCE(jsonb_agg(s - 'image' - 'image_url'), '[]'::jsonb)
                        FROM jsonb_array_elements(logo::jsonb->'subcategories') s
                    )
                ),
                '{leafCategories}',
                (
                    SELECT COALESCE(jsonb_agg(l - 'image' - 'image_url'), '[]'::jsonb)
                    FROM jsonb_array_elements(logo::jsonb->'leafCategories') l
                )
            )::text
            WHERE id = 'salbeau_category_subcategory_hierarchy';
        EXCEPTION WHEN OTHERS THEN
            -- In case of any parsing exception, provide graceful fallback
            NULL;
        END;
    END IF;

    -- Clean app_category_order_config JSON array
    IF EXISTS (SELECT 1 FROM public.brands WHERE id = 'app_category_order_config') THEN
        BEGIN
            UPDATE public.brands
            SET logo = (
                SELECT COALESCE(jsonb_agg(c - 'image' - 'image_url' - 'icon'), '[]'::jsonb)
                FROM jsonb_array_elements(logo::jsonb) c
            )::text
            WHERE id = 'app_category_order_config';
        EXCEPTION WHEN OTHERS THEN
            NULL;
        END;
    END IF;
END $$;

-- 7. CLEAR HOME BANNERS IMAGES (IF TABLE EXISTS)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'home_banners') THEN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'home_banners' AND column_name = 'imageUrl') THEN
            UPDATE public.home_banners SET "imageUrl" = NULL;
        END IF;
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'home_banners' AND column_name = 'image_url') THEN
            UPDATE public.home_banners SET image_url = NULL;
        END IF;
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'home_banners' AND column_name = 'image') THEN
            UPDATE public.home_banners SET image = NULL;
        END IF;
    END IF;
END $$;
