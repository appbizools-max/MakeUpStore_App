# SALBEAU MAKEUPSTORE — DEVELOPER SETUP & ONBOARDING GUIDE

## 1. Prerequisites

Before setting up the project locally, ensure you have the following installed on your workstation:
- **Node.js:** v18.17.0 or v20.x LTS recommended
- **npm:** v9.x or higher (bundled with Node.js)
- **Git:** v2.30+
- **Expo CLI (optional for mobile):** `npm install -g expo-cli`
- **Modern Web Browser:** Chrome / Edge / Firefox for Admin Console

---

## 2. Repository Architecture Overview

```
MakeUpStore_App/
├── admin/               # React 18 + Vite 5 Admin Management Console
├── app/                 # React Native + Expo SDK 51 Customer Mobile App
├── database/            # Supabase schema, sequenced migrations & documentation
├── docs/                # Architecture, audit, and developer guides
├── scripts/             # Database diagnostic and maintenance automation
└── archive/             # Retired prototypes and legacy components
```

---

## 3. Environment Configuration

### 3.1 Admin Panel (`admin/.env`)
Create `admin/.env` (or copy from `admin/.env.example` if present):
```env
# Supabase Configuration
VITE_SUPABASE_URL=https://<your-project-ref>.supabase.co
VITE_SUPABASE_ANON_KEY=<your-anon-public-key>
VITE_SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key-for-admin-ops>

# Application Port (Vite defaults to 3001 if configured)
PORT=3001
```

> [!WARNING]
> The `VITE_SUPABASE_SERVICE_ROLE_KEY` bypasses PostgreSQL Row Level Security (RLS). Never expose this key in client-facing public web pages or mobile binaries.

### 3.2 Customer Application (`app/.env`)
Create `app/.env`:
```env
EXPO_PUBLIC_SUPABASE_URL=https://<your-project-ref>.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=<your-anon-public-key>
```

---

## 4. Database Setup (Supabase)

All database migrations are located in [`database/migrations/`](file:///e:/MakeUpStore_App-main/MakeUpStore_App/database/migrations/).

For a fresh database environment:
1. Log into your [Supabase Dashboard](https://supabase.com/dashboard).
2. Open the **SQL Editor**.
3. Execute the migrations in sequential order:
   - `001_supabase_schema.sql` (Core tables: products, variants, categories, orders, customers)
   - `002_b2b_verification_migration.sql` (B2B documents, audit statuses, and business verification)
   - `003_custom_modules_migration.sql` (Employee governance, approvals, and RBAC permissions)
   - `004_inventory_removal_migration.sql` (Guarantees zero-stock model; removes legacy quantity columns)
   - `005_remove_all_images_migration.sql` (Cleans legacy demo URLs)
4. Verify Storage Bucket:
   - Navigate to **Storage** in the Supabase Dashboard.
   - Ensure a public bucket named `product-images` exists with Public Read access enabled.

---

## 5. Running the Admin Panel

```bash
# Navigate to the admin workspace
cd admin

# Install dependencies
npm install

# Start development server
npm run dev
```

The Admin Console will launch at:
👉 **`http://localhost:3001`** (or next available port).

To build the production bundle:
```bash
npm run build
```
Production assets are generated in `admin/dist/`.

---

## 6. Running the Customer Mobile Application

The customer application is built with Expo and can run in web preview mode or natively on iOS/Android via Expo Go.

```bash
# Navigate to the mobile workspace
cd app

# Install dependencies
npm install

# Start Expo development server
npm start
```

### Options:
- Press `w` in terminal to launch the **Web preview** in your browser.
- Press `a` to open in Android Emulator.
- Press `i` to open in iOS Simulator (macOS only).
- Scan the terminal QR code with the **Expo Go** app on your physical device.

---

## 7. Running Maintenance & Diagnostic Scripts

Scripts are located in `scripts/database/` and `scripts/maintenance/`.

```bash
# Test Supabase connection & check table health
node scripts/database/test_db.mjs

# Inspect current image storage URLs
node scripts/database/inspect_images.mjs

# Verify Supabase schema audit
node scripts/database/verify_supabase_audit.js
```

---

## 8. Verification Checklist

- [ ] Admin panel loads at `http://localhost:3001` with dark luxury theme.
- [ ] Product Catalog displays parent products and child variants.
- [ ] Category Manager allows creating and reordering categories.
- [ ] Image Dropzone modal opens and supports Upload, URL, Paste, and WebP compression.
- [ ] B2B Verification page displays pending applications and allows role assignment.
- [ ] `npm run build` in `admin/` completes with 0 errors.
