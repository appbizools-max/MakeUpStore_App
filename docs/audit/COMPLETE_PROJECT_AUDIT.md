# SALBEAU MAKEUPSTORE — COMPLETE REPOSITORY AUDIT REPORT

**Date:** 2026-10-24  
**Author:** Principal Software Architect & QA Automation Lead  
**Repository:** `MakeUpStore_App`  
**Target Environments:** React + Vite Admin Web Console, React Native + Expo Mobile Application, Supabase (PostgreSQL)  

---

## 1. Executive Summary

A comprehensive recursive audit of the Salbeau MakeUpStore codebase was executed to assess architectural integrity, folder organization, module dependencies, dead code, security hygiene, and database consistency.

### Primary Audit Findings:
1. **Application Architecture**: The repository contains two distinct applications:
   - **Admin Web Console (`admin/`)**: Vite 5 + React 18 + Tailwind CSS single-page management application for product cataloging, 3-level categories, multi-role pricing (General, Salon, Artist, Beautician), bulk Excel processing, B2B verification, employee governance, and order processing.
   - **Customer Mobile Application (`app/`)**: Dual-architecture app containing both a React Native / Expo (`app/App.js` with `app/src/features/*`) application for iOS/Android, and a React DOM web preview (`app/src/App.jsx` with `app/src/screens/*`).
2. **Database Architecture**: Powered by Supabase PostgreSQL with custom real-time subscriptions, role-based discounts, B2B verification workflows, and rich hierarchy JSON cache storage in `public.brands`.
3. **Inventory Management Removal**: Inventory tracking and stock management have been completely removed as per business requirements; products now operate on catalog status (`published`/`draft`) and role pricing without stock quantities or restock alerts.
4. **Code Organization Deficiencies**:
   - `admin/src/components/` is a flat folder containing 44 components mixing page screens, modals, sub-widgets, and legacy prototypes.
   - 10+ legacy prototype components exist with zero imports (`AddNewProductPage.jsx`, `UniversalVariantBuilder.jsx`, `CategorySubcategoryManager.jsx`, `BrowseConsoleModal.jsx`, `InlineImageSearchPanel.jsx`, `InlineShadeCard.jsx`, `ProductDiscoveryAndRichData.jsx`, `RowAttributeModal.jsx`, `RowImageUploadModal.jsx`, `RowQuantityTierModal.jsx`, `SmartAttributeSuggestionPanel.jsx`).
   - One-off scripts and debug files are scattered across `admin/` (`inspect_images.mjs`, `test_db.mjs`, `test_sql.mjs`, `verify_supabase_audit.js`) and root `scratch/`.
   - SQL migration files are located directly in the workspace root without an organized database structure.
   - Root has an empty, orphaned `package-lock.json` with no root `package.json`.

---

## 2. Technology Stack & Environment

| Sub-system | Technology / Library | Version | Role / Purpose |
| :--- | :--- | :--- | :--- |
| **Admin Frontend** | React / ReactDOM | 18.3.1 | Core UI Framework |
| **Admin Bundler** | Vite | 5.2.11 / 5.4.21 | Dev server (Port 3001) & Production Bundler |
| **Admin Styling** | Tailwind CSS / PostCSS | 3.4.1 | Utility-first CSS Design System |
| **Admin Icons** | Lucide React | 0.380.0 | High-quality iconography |
| **Admin Data Sheets** | SheetJS (xlsx) | 0.18.5 | High-speed multi-sheet Excel Import/Export |
| **Admin Scanner** | html5-qrcode | 2.3.8 | Camera-based barcode scanner integration |
| **Mobile App (Native)** | React Native / Expo | RN 0.74.5, Expo 51 | Cross-platform iOS/Android Mobile App |
| **Mobile App (Web)** | React / Tailwind CSS | 18.2.0 | Responsive web preview of customer store |
| **Backend & Database**| Supabase / PostgreSQL | 2.116.0 JS SDK | Auth, Real-time DB, Storage & RPC functions |
| **Legacy Cloud** | Firebase SDK | 10.12.0 | Legacy authentication and Firestore rules fallback |

---

## 3. Directory Layout (As Audited)

```
MakeUpStore_App/
├── .gitignore
├── README.md
├── Salbeau_App_Screens_PRD.md
├── firestore.rules
├── package-lock.json                           <-- [MISPLACED] Empty root lockfile (7 lines)
├── mobile_screen.png                           <-- [ASSET] Reference mockup screenshot
├── supabase_schema.sql                         <-- [DATABASE] Master PostgreSQL Schema
├── supabase_inventory_removal_migration.sql    <-- [DATABASE] Inventory Removal SQL
├── supabase_b2b_verification_migration.sql     <-- [DATABASE] B2B Verification SQL
├── supabase_custom_modules_migration.sql       <-- [DATABASE] Governance & Audit SQL
├── supabase_remove_all_images_migration.sql    <-- [DATABASE] Master Image Cleanup SQL
│
├── scratch/                                    <-- [SCRIPTS] Temporary scripts
│   ├── apply_admin_theme_and_search.js
│   ├── clean_fallbacks.mjs
│   ├── clean_hierarchy.mjs
│   └── harmonize_components_theme.js
│
├── admin/                                      <-- ADMIN WEB CONSOLE
│   ├── package.json
│   ├── package-lock.json
│   ├── vite.config.js
│   ├── index.html
│   ├── postcss.config.js
│   ├── tailwind.config.js
│   ├── inspect_images.mjs                      <-- [SCRIPT] One-off diagnostic script
│   ├── test_db.mjs                             <-- [SCRIPT] One-off DB test script
│   ├── test_sql.mjs                            <-- [SCRIPT] One-off SQL test script
│   ├── verify_supabase_audit.js                <-- [SCRIPT] Supabase audit script
│   ├── vite.config.js.timestamp-*              <-- [ARTIFACT] Vite temporary cache
│   ├── public/
│   │   ├── favicon.ico
│   │   ├── favicon.svg
│   │   └── banners/ (banner_1.jpg ... banner_5.jpg)
│   └── src/
│       ├── main.jsx                            <-- Vite entry point
│       ├── App.jsx                             <-- Master layout, routing, modals (9,068 lines)
│       ├── index.css
│       ├── firebase.js
│       ├── Assets/Logo.png
│       ├── config/
│       │   ├── firebase.js
│       │   └── supabase.js
│       ├── context/
│       │   └── AdminContext.jsx                <-- Global data state & Supabase hooks (3,645 lines)
│       ├── services/
│       │   ├── aiColorService.js
│       │   ├── barcodeLookupService.js
│       │   ├── excelProcessorService.js
│       │   ├── imageSearchService.js
│       │   └── productEngineService.js
│       ├── utils/
│       │   ├── attributeMasterData.js
│       │   ├── b2bVerificationService.js
│       │   ├── barcodeUtils.js
│       │   ├── customerSearchService.js
│       │   ├── excelTemplateGenerator.js
│       │   ├── imageOptimizer.js
│       │   ├── orderIdUtils.js
│       │   ├── permissionEngine.js
│       │   ├── productDescriptionGenerator.js
│       │   ├── productRichDataEngine.js
│       │   ├── productSearchEngine.js
│       │   ├── quantityTiersUtils.js
│       │   ├── useHardwareBarcodeScanner.js
│       │   └── useVirtualScroll.js
│       └── components/                         <-- Flat folder (44 items)
│           ├── employees/                      <-- Submodule (6 items)
│           ├── redesign/                       <-- Submodule (5 items)
│           └── [33 components directly in root of components/]
│
└── app/                                        <-- CUSTOMER MOBILE APPLICATION
    ├── package.json
    ├── package-lock.json
    ├── app.json                                <-- Expo manifest
    ├── App.js                                  <-- React Native Expo entry point
    ├── babel.config.js
    ├── metro.config.js
    ├── tailwind.config.js
    ├── index.html                              <-- Web preview HTML
    ├── google-services.json
    ├── android/                                <-- Native Android project build
    ├── Assets/                                 <-- Static brand & category banners
    └── src/
        ├── main.jsx                            <-- React DOM web preview entry
        ├── App.jsx                             <-- React DOM web shell
        ├── index.css
        ├── firebase.js
        ├── config/
        │   ├── categoriesHierarchy.js
        │   ├── firebase.js
        │   └── supabase.js
        ├── context/
        │   ├── AppContext.js                   <-- React Native AsyncStorage context
        │   └── AppContext.jsx                  <-- React DOM localStorage context
        ├── features/                           <-- React Native screens (10 folders)
        ├── screens/                            <-- React DOM web screens (18 screens)
        └── utils/
            ├── b2bVerificationService.js
            ├── customerSearchService.js
            ├── imageUtils.js
            ├── orderIdUtils.js
            ├── pincodeService.js
            ├── productSearchEngine.js
            ├── quantityTiersUtils.js
            ├── recommendationEngine.js
            └── storage.js
```

---

## 4. In-Depth Component Analysis & Dependency Graph

### 4.1 Admin Panel Active vs Unused Components

| File Name | Size (Lines) | Status | Direct Importers / Consumers | Role / Purpose |
| :--- | :--- | :--- | :--- | :--- |
| `MainCategoriesManager.jsx` | 3,176 | **Active** | `App.jsx` (L4171) | Level 1, Level 2, Level 3 Categories, reordering, live Supabase sync |
| `AddNewProductPage_Redesigned.jsx`| 4,082 | **Active** | `App.jsx` (L96 as `AddNewProductPage`) | Comprehensive 4-step product creator with shades, variants, pricing |
| `ProductsCatalogMatrix.jsx` | 1,496 | **Active** | `App.jsx` (L94) | Catalog matrix table, status filters, multi-role prices, inline actions |
| `DynamicVariantBuilder.jsx` | 1,023 | **Active** | `AddNewProductPage_Redesigned.jsx` (L76) | Variant combination generator, universal shade picker |
| `ExcelImportModal.jsx` | 1,048 | **Active** | `ProductsCatalogMatrix.jsx` | Multi-sheet Excel importer with auto-attribute and validation |
| `ProductFormRightPanel.jsx` | 425 | **Active** | `AddNewProductPage_Redesigned.jsx` | Live mobile phone preview card while authoring products |
| `BarcodeScannerModal.jsx` | 196 | **Active** | `App.jsx`, `ProductsCatalogMatrix.jsx` | Camera-based barcode scanner using html5-qrcode |
| `BarcodeSearchResultModal.jsx` | 197 | **Active** | `App.jsx` | Quick product preview when scanning barcode in admin header |
| `BarcodeLookupReviewModal.jsx` | 277 | **Active** | `AddNewProductPage_Redesigned.jsx` (L81) | Automatic web search barcode lookup reviewer |
| `ImageDropzoneUploader.jsx` | 167 | **Active** | `AddNewProductPage_Redesigned.jsx` | File picker, drag-and-drop & paste uploader |
| `ImageField.jsx` | 193 | **Active** | `App.jsx` | Form image input trigger for ImageManagerModal |
| `ImageManagerModal.jsx` | 179 | **Active** | `ImageField.jsx`, `ImageDropzoneUploader.jsx` | Multi-tab image uploader with sticky header, close button |
| `InlineImageSection.jsx` | 413 | **Active** | `MainCategoriesManager.jsx` | Clean inline image editor with drag-and-drop, Google search |
| `RolePricingMatrix.jsx` | 258 | **Active** | `App.jsx`, `AddNewProductPage_Redesigned.jsx` | 4-tier role pricing calculator (General, Salon, Artist, Beautician) |
| `RoleQuantityTiersManager.jsx` | 316 | **Active** | `App.jsx`, `AddNewProductPage_Redesigned.jsx` | B2B wholesale volume discount tier rules manager |
| `ShadePricingModal.jsx` | 288 | **Active** | `App.jsx`, `ProductsCatalogMatrix.jsx` | Modal to adjust individual prices per shade/variant |
| `AbandonedCartsManager.jsx` | 448 | **Active** | `App.jsx` (L95) | Real-time abandoned checkout tracking & customer recovery |
| `B2BVerificationPage.jsx` | 1,489 | **Active** | `App.jsx` (L102) | Salon/artist B2B proof review, license verification, approvals |
| `ApprovalCenterPage.jsx` | 895 | **Active** | `App.jsx` (L103) | Staged multi-tier approval workflow for catalog/price modifications |
| `AuditTrailPage.jsx` | 512 | **Active** | `App.jsx` (L104) | Immutable employee activity logs and security audits |
| `CustomerSearchRequestsPage.jsx` | 382 | **Active** | `App.jsx` (L101) | Out-of-catalog customer search intent monitoring |
| `AttributesMasterPage.jsx` | 642 | **Active** | `App.jsx` (L98) | Global beauty attribute taxonomies (Skin Type, Coverage, Finish) |
| `BulkProductEntryModal.jsx` | 344 | **Active** | `App.jsx` (L97) | Fast tabular grid entry for batch product insertion |
| `ColumnManagerModal.jsx` | 128 | **Active** | `BulkProductEntryModal.jsx` | Show/hide customizable matrix columns |
| `FulfillmentStatusSelector.jsx` | 185 | **Active** | `App.jsx` (L3569, L4313) | Quick-order status dropdown for packaging and shipping |
| `GeneratedDataPanel.jsx` | 148 | **Active** | `App.jsx` (L105) | AI smart description and keyword review badge |
| `HexColorPicker.jsx` | 218 | **Active** | `App.jsx`, `DynamicVariantBuilder.jsx` | Color swatch picker with shade naming engine |
| `SearchableSelect.jsx` | 175 | **Active** | `App.jsx`, `MainCategoriesManager.jsx` | Searchable dropdown selector with keyboard support |
| `employees/*` (6 files) | ~1,800 | **Active** | `App.jsx` | Employee RBAC permissions, audit, profiles |
| `redesign/*` (5 files) | ~400 | **Active** | `AddNewProductPage_Redesigned.jsx` | Step cards and live mini previews |
| **`AddNewProductPage.jsx`** | 1,372 | **Unused / Obsolete** | *None* (superseded by `AddNewProductPage_Redesigned.jsx`) | Early prototype product page |
| **`CategorySubcategoryManager.jsx`** | 1,978 | **Unused / Obsolete** | *Imported on L100 of App.jsx but never rendered* | Legacy 2-level category manager (replaced by 3-level `MainCategoriesManager`) |
| **`UniversalVariantBuilder.jsx`** | 845 | **Unused / Obsolete** | *None* (superseded by `DynamicVariantBuilder.jsx`) | Early prototype variant builder |
| **`BrowseConsoleModal.jsx`** | 142 | **Unused / Obsolete** | *None* | Early debug modal |
| **`InlineImageSearchPanel.jsx`** | 186 | **Unused / Obsolete** | *None* (superseded by `InlineImageSection.jsx`) | Early image search panel |
| **`InlineShadeCard.jsx`** | 114 | **Unused / Obsolete** | *None* | Early shade card widget |
| **`ProductDiscoveryAndRichData.jsx`**| 240 | **Unused / Obsolete** | *None* | Redundant rich data panel |
| **`RowAttributeModal.jsx`** | 165 | **Unused / Obsolete** | *None* | Standalone modal superseded by inline modal |
| **`RowImageUploadModal.jsx`** | 180 | **Unused / Obsolete** | *None* | Standalone modal superseded by ImageManagerModal |
| **`RowQuantityTierModal.jsx`** | 175 | **Unused / Obsolete** | *None* | Standalone modal superseded by RoleQuantityTiersManager |
| **`SmartAttributeSuggestionPanel.jsx`**| 192 | **Unused / Obsolete** | *None* | Unused helper panel |

---

## 5. Database Architecture & SQL Migrations Audit

The database runs on Supabase (PostgreSQL 15). The following migration scripts were identified and verified:

1. **`supabase_schema.sql`**: Master database definition creating `users`, `categories`, `brands`, `products`, `orders`, `b2b_verifications`, `verification_documents`, `verification_history`, `customer_search_requests`, `abandoned_carts`, `employees`, `employee_permissions`, `employee_activity_logs`, `employee_staged_operations`, `home_banners`, and `pricing_rules`.
2. **`supabase_inventory_removal_migration.sql`**: Safe idempotence script removing `stock`, `inventory_quantity`, and `low_stock_threshold` constraints; cleans and drops inventory triggers.
3. **`supabase_b2b_verification_migration.sql`**: Complete B2B document verification schemas, approval status triggers, and verification history logs.
4. **`supabase_custom_modules_migration.sql`**: Governance, staged operations, and employee activity logging tables.
5. **`supabase_remove_all_images_migration.sql`**: Master database image cleanup script resetting `categories.image`, `subcategories.image`, `product_types.image`, `products.image`, `products.images`, and `brands.logo` (hierarchy cache).

---

## 6. Security & Sensitive Data Audit

1. **API Keys**:
   - `admin/src/config/supabase.js` and `app/src/config/supabase.js` use the public `anon` key (`SUPABASE_ANON_KEY`) for client access.
   - `supabaseAdmin` service role key is conditionally initialized when provided via `VITE_SUPABASE_SERVICE_ROLE_KEY` environment variable.
   - `.env` files are not committed to git; `.gitignore` properly includes `.env`, `.env.local`, and `node_modules`.
2. **Git Hygiene**:
   - Working tree is clean on commit `c988d26`.
   - Temporary Vite build timestamp artifacts (`vite.config.js.timestamp-*`) should be removed and added to `.gitignore`.
3. **RBAC & Authorization**:
   - Both client-side permissions engine (`permissionEngine.js`) and database row-level security (RLS) enforce employee role governance (`super_admin`, `catalog_manager`, `order_manager`, `b2b_reviewer`).

---

## 7. Recommended Target Structure & Strategy

To eliminate clutter and establish production-grade maintainability:
1. **Admin Panel Refactoring**:
   - Group `admin/src/components/` into feature directories: `products/`, `categories/`, `orders/`, `customers/`, `b2b/`, `governance/`, `shared/`, `modals/`.
   - Update imports cleanly without altering component logic.
2. **Dead Code Archival**:
   - Move confirmed unused legacy components (`AddNewProductPage.jsx`, `CategorySubcategoryManager.jsx`, `UniversalVariantBuilder.jsx`, `BrowseConsoleModal.jsx`, `InlineImageSearchPanel.jsx`, `InlineShadeCard.jsx`, `ProductDiscoveryAndRichData.jsx`, `RowAttributeModal.jsx`, `RowImageUploadModal.jsx`, `RowQuantityTierModal.jsx`, `SmartAttributeSuggestionPanel.jsx`) to `archive/legacy/` with a descriptive `README.md`.
3. **Scripts Organization**:
   - Move one-off testing and diagnostic scripts (`inspect_images.mjs`, `test_db.mjs`, `test_sql.mjs`, `verify_supabase_audit.js`, `scratch/*`) into `scripts/` with clear descriptions.
4. **Database Migrations Organization**:
   - Move all `.sql` files to `database/migrations/` and retain root copies/pointers for automated tooling.
5. **Documentation**:
   - Maintain complete architectural records in `docs/architecture/` and developer guides in `docs/development/`.
