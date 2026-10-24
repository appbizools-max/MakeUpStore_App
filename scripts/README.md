# SALBEAU MAKEUPSTORE — SCRIPTS DIRECTORY

This directory houses development, diagnostic, and maintenance scripts for the Salbeau MakeUpStore platform.

---

## 1. Database Diagnostic Scripts (`scripts/database/`)

- **`inspect_images.mjs`**: Queries Supabase to inspect image columns in `categories`, `subcategories`, and `brands`.
- **`test_db.mjs`**: Direct connection and table connectivity test for Supabase PostgreSQL.
- **`test_sql.mjs`**: Tests direct SQL execution against Supabase.
- **`verify_supabase_audit.js`**: Audits database tables, triggers, and column consistency.

## 2. Maintenance Scripts (`scripts/maintenance/`)

- **`clean_fallbacks.mjs`**: Automated script that scans codebase and removes hardcoded Unsplash fallback URLs.
- **`clean_hierarchy.mjs`**: Strips mock and stock photo URLs from category hierarchy configurations.
- **`apply_admin_theme_and_search.js`**: Theme tuning and search engine utility.
- **`harmonize_components_theme.js`**: Harmonizes UI styling tokens across admin components.

---

## Execution Instructions

Run any script with Node.js from the repository root:

```bash
node scripts/database/verify_supabase_audit.js
node scripts/maintenance/clean_fallbacks.mjs
```
