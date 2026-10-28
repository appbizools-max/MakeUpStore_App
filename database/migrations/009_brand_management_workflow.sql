-- ==============================================================================
-- SALBEAU MAKEUPSTORE — ENTERPRISE BRAND MANAGEMENT WORKFLOW MIGRATION
-- Migration 009: Robust Sequential Brand Number, Professional Brand Code,
-- Multi-Category Associations, Image Storage Bucket, and Data Integrity
-- ==============================================================================

-- 1. Ensure Columns on public.brands
ALTER TABLE public.brands
ADD COLUMN IF NOT EXISTS brand_number TEXT,
ADD COLUMN IF NOT EXISTS brand_code TEXT,
ADD COLUMN IF NOT EXISTS categories JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS internal_notes TEXT;

-- 2. Unique Constraints & Fast Lookup Indexes
CREATE UNIQUE INDEX IF NOT EXISTS idx_brands_brand_number ON public.brands (brand_number)
WHERE brand_number IS NOT NULL AND brand_number NOT LIKE 'app_%' AND brand_number NOT LIKE 'salbeau_%';

CREATE UNIQUE INDEX IF NOT EXISTS idx_brands_brand_code ON public.brands (brand_code)
WHERE brand_code IS NOT NULL AND brand_code NOT LIKE 'app_%' AND brand_code NOT LIKE 'salbeau_%';

CREATE INDEX IF NOT EXISTS idx_brands_name_lower ON public.brands (LOWER(TRIM(name)));
CREATE INDEX IF NOT EXISTS idx_brands_enabled ON public.brands (enabled);

-- 3. Sequence for Concurrency-Safe Sequential Brand Number Generation (BR001, BR002, ...)
CREATE SEQUENCE IF NOT EXISTS public.brand_number_seq START WITH 366 INCREMENT BY 1;

-- Dynamic alignment of sequence with existing max brand number (never reuses deleted IDs)
DO $$
DECLARE
    max_num INTEGER;
BEGIN
    SELECT COALESCE(MAX(NULLIF(regexp_replace(brand_number, '^BR0*', ''), '')::INTEGER), 365)
    INTO max_num
    FROM public.brands
    WHERE brand_number ~ '^BR[0-9]+$';

    IF max_num >= 365 THEN
        PERFORM setval('public.brand_number_seq', max_num + 1, false);
    END IF;
END $$;

-- 4. Function to generate next permanent Brand Number
CREATE OR REPLACE FUNCTION public.generate_next_brand_number()
RETURNS TEXT AS $$
DECLARE
    next_id BIGINT;
    formatted_num TEXT;
BEGIN
    next_id := nextval('public.brand_number_seq');
    IF next_id <= 999 THEN
        formatted_num := 'BR' || LPAD(next_id::TEXT, 3, '0');
    ELSE
        formatted_num := 'BR' || next_id::TEXT;
    END IF;
    RETURN formatted_num;
END;
$$ LANGUAGE plpgsql;

-- 5. Trigger to automatically assign Brand Number on Insert if omitted
CREATE OR REPLACE FUNCTION public.trg_assign_brand_number()
RETURNS TRIGGER AS $$
BEGIN
    -- Do not assign brand number to internal config rows (app_*, salbeau_*)
    IF NEW.id LIKE 'app_%' OR NEW.id LIKE 'salbeau_%' THEN
        RETURN NEW;
    END IF;

    IF NEW.brand_number IS NULL OR TRIM(NEW.brand_number) = '' THEN
        NEW.brand_number := public.generate_next_brand_number();
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_assign_brand_number ON public.brands;
CREATE TRIGGER trigger_assign_brand_number
BEFORE INSERT ON public.brands
FOR EACH ROW
EXECUTE FUNCTION public.trg_assign_brand_number();

-- 6. Add Brand Reference Columns on Products for High-Speed Lookups
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS brand_number TEXT,
ADD COLUMN IF NOT EXISTS brand_code TEXT;

CREATE INDEX IF NOT EXISTS idx_products_brand_id ON public.products (brand_id);
CREATE INDEX IF NOT EXISTS idx_products_brand_number ON public.products (brand_number);
CREATE INDEX IF NOT EXISTS idx_products_brand_code ON public.products (brand_code);

-- 7. Ensure Storage Bucket for Brand Logos Exists
INSERT INTO storage.buckets (id, name, public)
VALUES ('brand-logos', 'brand-logos', true)
ON CONFLICT (id) DO NOTHING;

-- 8. Storage RLS Policies for Brand Logos (Public read, Authenticated write)
DO $$
BEGIN
    -- Public Read
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'objects' AND schemaname = 'storage' AND policyname = 'Public Brand Logo Read'
    ) THEN
        CREATE POLICY "Public Brand Logo Read" ON storage.objects
        FOR SELECT USING (bucket_id = 'brand-logos');
    END IF;

    -- Authenticated / Service Upload
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'objects' AND schemaname = 'storage' AND policyname = 'Admin Brand Logo Upload'
    ) THEN
        CREATE POLICY "Admin Brand Logo Upload" ON storage.objects
        FOR ALL USING (bucket_id = 'brand-logos')
        WITH CHECK (bucket_id = 'brand-logos');
    END IF;
END $$;
