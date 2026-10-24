# SALBEAU MAKEUPSTORE — DATABASE MIGRATIONS

This directory maintains the chronological SQL migrations and schema definitions for the Salbeau MakeUpStore Supabase PostgreSQL database.

---

## Migration Sequence

Execute migrations in the following order in the Supabase SQL Editor:

1. **`001_supabase_schema.sql`**: Base platform schema (`users`, `categories`, `brands`, `products`, `orders`, `b2b_verifications`, `home_banners`, `pricing_rules`).
2. **`002_b2b_verification_migration.sql`**: B2B customer document verification tables, verification history, and automated status triggers.
3. **`003_custom_modules_migration.sql`**: Employee governance, staged operations, activity audit logs, and search request analytics.
4. **`004_inventory_removal_migration.sql`**: Complete removal of inventory constraints, stock management, and restock triggers.
5. **`005_remove_all_images_migration.sql`**: Purges all image URLs and stock photo fallbacks from database tables, keeping category names, products, and hierarchy structures intact.

---

## Execution Guidelines

- All migrations are written to be **safe and idempotent** (`IF NOT EXISTS`, `ADD COLUMN IF NOT EXISTS`, `DO $$ BEGIN ... END $$;`).
- Always run migrations on a staging project before applying to production.
- Keep copies at the root directory if any automated deployment pipelines reference root paths.
