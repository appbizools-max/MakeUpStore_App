# SALBEAU MAKEUPSTORE — PROJECT BASELINE AND ARCHITECTURE AUDIT

**Document Reference:** `docs/quality-and-release/PROJECT_BASELINE_AND_ARCHITECTURE_AUDIT.md`  
**Date:** 2026-10-25  
**Audit Team:** Principal Software Architect, Senior Full-Stack Developers, Database Architect, DevOps & Release Engineers  
**Target Environments:**
- Admin Web Console: React 18, Vite 5, Tailwind CSS (Port 3001)
- Customer Mobile App: React Native 0.74.5, Expo SDK 51, NativeWind (`com.salbeau.app`)
- Backend & Database: Supabase PostgreSQL (Multi-tenant, RLS, Real-time Subscriptions)

---

## 1. Executive Summary

This architecture audit establishes the production baseline for the Salbeau MakeUpStore application suite. The platform operates as a multi-tier beauty cosmetic commerce ecosystem featuring retail customer ordering, role-based professional B2B pricing (General User, Salon Owner, Makeup Artist, Beautician), batch catalogue ingestion, and an operational administration console.

### Key Baseline Findings:
1. **Repository Layout**:
   - Web Administration Panel: [admin/](file:///e:/MakeUpStore_App-main/MakeUpStore_App/admin) (Vite 5.4.21, React 18.3.1, Tailwind 3.4.1).
   - Mobile Customer Application: [app/](file:///e:/MakeUpStore_App-main/MakeUpStore_App/app) (Expo SDK 51, React Native 0.74.5, Prebuilt Android native runtime).
   - Database Migrations: [database/](file:///e:/MakeUpStore_App-main/MakeUpStore_App/database) and root SQL files.
   - Quality & Verification Scripts: [scripts/maintenance/](file:///e:/MakeUpStore_App-main/MakeUpStore_App/scripts/maintenance).
2. **Zero-Stock Policy**:
   - The platform strictly enforces a zero-inventory-tracking rule. Finite inventory counters, warehouse ledgers, and restock notifications have been eliminated. Products and child shades operate exclusively on boolean status (`published`/`draft`) and active flags (`is_active`).
3. **4-Tier Role-Based Commercial Pricing**:
   - Every catalogue item supports 4 commercial pricing tiers: Retail MRP (Maximum Retail Price), General User Price, Salon Owner Wholesale Price, Makeup Artist Pro Price, and Beautician Trade Price.
4. **Build & Compilation Health**:
   - Admin Panel production bundle builds cleanly in **11.72s** with 1,622 modules transformed and automated vendor chunking.
   - Zero TypeScript or JSX compilation errors in production assets.

---

## 2. Full Architecture Inventory

```
+---------------------------------------------------------------------------------------+
|                                SALBEAU MAKEUPSTORE                                    |
+---------------------------------------------------------------------------------------+
            |                                                       |
            v                                                       v
+-------------------------------+                       +-------------------------------+
|       ADMIN WEB CONSOLE       |                       |     CUSTOMER MOBILE APP       |
|    React 18 + Vite 5 + TW     |                       |   Expo SDK 51 + React Native  |
|   (Port 3001 / Cloudflare)    |                       |    Package: com.salbeau.app   |
+-------------------------------+                       +-------------------------------+
            |                                                       |
            |-- Excel Import & Dynamic Template                     |-- B2C / B2B Trade Auth
            |-- 3-Level Category Manager (L1, L2, L3)               |-- 4-Tier Dynamic Pricing
            |-- Role Pricing Matrix & Volume Tiers                  |-- Shade Variant Carousel
            |-- B2B License Verification & Approval                 |-- Cart & Multi-Step Checkout
            |-- Realtime Orders & Abandoned Carts                   |-- Local Cache & Offline Seed
            +---------------------------+---------------------------+
                                        |
                                        v
                    +---------------------------------------+
                    |          SUPABASE POSTGRESQL          |
                    |         (Real-time + PostgREST)       |
                    +---------------------------------------+
                                        |
            +---------------------------+---------------------------+
            |                           |                           |
            v                           v                           v
  [public.products]             [public.b2b_trade]            [public.orders]
  - Parent SKU                  - Trade Registration          - Order Status State Machine
  - 4 Role Price Columns        - License & Document URLs     - Item Fulfillment Stages
  - Shades JSON Array           - Approval Audit Trail        - Role Discount Applied
```

### 2.1 Frontend Administration Application (`admin/`)
- **Framework:** React 18.3.1 with Vite 5.2.11 / 5.4.21.
- **Entry Points:** [admin/src/main.jsx](file:///e:/MakeUpStore_App-main/MakeUpStore_App/admin/src/main.jsx) and [admin/src/App.jsx](file:///e:/MakeUpStore_App-main/MakeUpStore_App/admin/src/App.jsx).
- **Core Modules:**
  * [BulkProductEntryModal.jsx](file:///e:/MakeUpStore_App-main/MakeUpStore_App/admin/src/components/products/BulkProductEntryModal.jsx): High-density 27-column spreadsheet matrix for bulk creation.
  * [ProductsCatalogMatrix.jsx](file:///e:/MakeUpStore_App-main/MakeUpStore_App/admin/src/components/products/ProductsCatalogMatrix.jsx): Filterable, searchable data grid with live status toggles.
  * [AddNewProductPage_Redesigned.jsx](file:///e:/MakeUpStore_App-main/MakeUpStore_App/admin/src/components/products/AddNewProductPage_Redesigned.jsx): 4-step wizard for detailed product authoring.
  * [B2BVerificationPage.jsx](file:///e:/MakeUpStore_App-main/MakeUpStore_App/admin/src/components/b2b/B2BVerificationPage.jsx): Trade certificate and GST verification workflow.
  * [MainCategoriesManager.jsx](file:///e:/MakeUpStore_App-main/MakeUpStore_App/admin/src/components/categories/MainCategoriesManager.jsx): 3-tier hierarchical category taxonomy manager.

### 2.2 Customer Mobile Application (`app/`)
- **Framework:** React Native 0.74.5, Expo SDK ~51.0.0, NativeWind 2.0.11.
- **Package Identifier:** `com.salbeau.app` (defined in [app/app.json](file:///e:/MakeUpStore_App-main/MakeUpStore_App/app/app.json)).
- **Dual Runtime Support:**
  * Native Mobile (`app/App.js`): Running on Android/iOS via React Native bridge.
  * Web Storefront Preview (`app/src/App.jsx`): React DOM responsive storefront preview with 18 dedicated screen components.
- **Offline Resilience:** Built-in seed data and fallback providers prevent blank screens when network connectivity drops.

### 2.3 Backend & Database Architecture
- **Engine:** Supabase PostgreSQL with PostgREST automated API endpoints.
- **Authentication:** Supabase Auth (JWT bearer tokens) with role claims.
- **Master Tables:**
  * `public.products`: Parent products containing title, brand, category, 4 role pricing fields, active status, and `shades` JSON array.
  * `public.brands`: Brand taxonomy with cached hierarchy data.
  * `public.categories`: 3-level taxonomy hierarchy.
  * `public.b2b_verifications`: Trade license submissions, verification documents, and audit logs.
  * `public.orders` and `public.order_items`: Commerce checkout records and state machine fulfillment tracking.

---

## 3. Baseline Health Metrics

| Metric | Measured Baseline Value | Evaluation Target | Status |
| :--- | :--- | :--- | :--- |
| **Vite Production Build** | **11.72s** (1,622 modules) | < 30.0s | ✅ PASS |
| **Admin Production Bundle** | **784.78 kB** (177.63 kB gzip) | < 1.0 MB gzip | ✅ PASS |
| **Vendor Chunks** | Separated: `xlsx`, `scanner`, `supabase`, `react` | Clean separation | ✅ PASS |
| **Compilation Errors** | **0 errors** | 0 errors | ✅ PASS |
| **Core Platform Automated Tests** | **60 / 60 Passed** | 100% Pass | ✅ PASS |
| **Bulk Product Entry Tests** | **35 / 35 Passed** | 100% Pass | ✅ PASS |
| **Excel Ingestion Tests** | **32 / 32 Passed** | 100% Pass | ✅ PASS |
| **Database Concurrency Tests** | **12 / 12 Passed** | 100% Pass | ✅ PASS |
| **Security & Privacy Tests** | **15 / 15 Passed** | 100% Pass | ✅ PASS |
| **Total Automated Tests** | **154 / 154 Passed (100%)** | 100% Pass | ✅ PASS |

---

## 4. Protected Business Rules & Non-Negotiables

1. **Zero-Stock Policy**:
   - No table column or frontend form control shall introduce `stock_quantity`, `inventory_count`, or `restock_alerts`. Merchandising availability is binary (`published` vs `draft`, `is_active` boolean).
2. **4-Tier Role Pricing Hierarchy**:
   - `MRP` >= `General User Price` >= `Salon Price` / `Makeup Artist Price` / `Beautician Price`.
   - B2B trade prices are accessible strictly to verified business accounts.
3. **Parent-Variant Catalog Integrity**:
   - All variants share the parent entity's `parentSku`.
   - Each variant possesses its own unique `variantSku`, `variantBarcode`, shade name, and swatch hex color.
4. **Data Protection & Credentials**:
   - No `service_role` keys or private cloud keys are committed in source code or client bundles. All client interactions use public anon keys restricted by PostgreSQL Row Level Security (RLS).
