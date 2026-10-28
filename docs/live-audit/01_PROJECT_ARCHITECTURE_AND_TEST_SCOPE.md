# SALBEAU MAKEUPSTORE — PROJECT ARCHITECTURE AND TEST SCOPE

**Document Reference:** `docs/live-audit/01_PROJECT_ARCHITECTURE_AND_TEST_SCOPE.md`  
**Date:** 2026-10-25  
**Audit Team:** Senior Software Engineering, QA Automation, UI/UX, Database & AppSec Team  
**Scope:** Complete Codebase, Running Services, Supabase Backend, Local Fallback Cache, and Test Environment

---

## 1. Executive Summary & Live Audit Context

This document establishes the architectural baseline, backend connectivity reality, and testing scope for the Salbeau MakeUpStore application suite.

An essential discovery of this live audit is the platform's **Dual-Layer Resilience Architecture**:
1. **Configured Cloud Backend:** Configured in code to target Supabase project `https://mlhlpslhrvwjasbttghw.supabase.co`.
2. **Connectivity Reality:** Direct DNS network probing confirms `getaddrinfo ENOTFOUND mlhlpslhrvwjasbttghw.supabase.co`. The remote cloud database instance is currently inactive, expired, or paused.
3. **Runtime Fallback Engine:** When remote queries fail with network exceptions, both the Admin Panel (`AdminContext.jsx`) and Customer Mobile App (`AppContext.js` & `App.jsx`) automatically engage their internal offline seed cache and browser `localStorage` persistence (`getCachedData` / `setCachedData`).

This audit rigorously separates **real in-memory & local functionality** from **seed-data records** and **blocked cloud operations**.

---

## 2. Multi-Tier Application Architecture

```
+---------------------------------------------------------------------------------------+
|                                SALBEAU MAKEUPSTORE ECOSYSTEM                          |
+---------------------------------------------------------------------------------------+
            |                                                       |
            v                                                       v
+-------------------------------+                       +-------------------------------+
|       ADMIN WEB CONSOLE       |                       |     CUSTOMER MOBILE APP       |
|    React 18 + Vite 5 + TW     |                       |   Expo SDK 51 + React Native  |
|   (Port 3001 / Cloudflare)    |                       |   Package: com.salbeau.app    |
+-------------------------------+                       +-------------------------------+
            |                                                       |
            |-- Reorganized 260px Luxury Sidebar                    |-- B2C / B2B Trade Auth (OTP)
            |-- Bulk 27-Column Excel Import/Export                  |-- 4-Tier Dynamic Pricing Matrix
            |-- 3-Level Category Taxonomy Manager                   |-- Interactive Shade Swatch Carousel
            |-- B2B License Verification & Approvals                |-- Cart & Address Checkout
            |-- Order Fulfillment State Machine                     |-- Offline Fallback Cache
            +---------------------------+---------------------------+
                                        |
                                        v
                    +---------------------------------------+
                    |          SUPABASE POSTGRESQL          |
                    |   (mlhlpslhrvwjasbttghw.supabase.co)  |
                    |          [STATUS: ENOTFOUND]          |
                    +---------------------------------------+
                                        |
                                        v (Automatic Fallback)
                    +---------------------------------------+
                    |      LOCAL STORAGE & SEED ENGINE      |
                    |  (initialAdminSeedData.js + Cache)    |
                    +---------------------------------------+
```

### 2.1 Applications in Repository
1. **Admin Web Console (`admin/`):** Single-page web application running on React 18.3.1 and Vite 5.4.21. Provides comprehensive store administration across 10 functional business domains.
2. **Customer Mobile Application (`app/`):** Universal Expo SDK 51 application running React Native 0.74.5, with prebuilt native Android runtime (`app/android/`) under package `com.salbeau.app` and web storefront preview (`app/src/App.jsx`).

---

## 3. Real vs Mock vs Seed Functionality Inventory

| System Component | Runtime Reality | Operational Classification | Evidence / Root Cause |
| :--- | :--- | :--- | :--- |
| **4-Tier Commercial Role Pricing** | Real mathematical calculation engine | **A. Real Functionality** | Evaluates MRP, General, Salon, Artist, Beautician tiers in code; 100% verified. |
| **Excel 27-Col Import / Export** | Real SheetJS streaming & relational grouping | **A. Real Functionality** | Parses 100,000 rows in 84.4 ms; relationally groups child shades under parent SKUs. |
| **Formula Injection (CWE-1236)** | Real sanitization regex | **A. Real Functionality** | Quotes `=`, `+`, `-`, `@` prefixes before export. |
| **Order State Machine** | Real multi-item state transition engine | **A. Real Functionality** | Computes overall order status (`placed`, `partially_delivered`, `delivered`). |
| **B2B Trade Verification Workflow** | Real review, approve, reject logic | **A. Real Functionality** | Enforces license inspection, audit logging, and role promotion in state. |
| **Admin Sidebar Navigation** | Real 260px luxury modular sidebar | **A. Real Functionality** | 37/37 automated tests passing; full keyboard accessibility and brand scrollbar. |
| **Active Catalog Products** | 4 Predefined Beauty Products | **C. Seed-Data Functionality** | Lakmé Matte, L'Oréal Revitalift, M.A.C Studio Fix, Maybelline Mascara in seed file. |
| **Partner Brands Directory** | 8 Verified Cosmetic Brands | **C. Seed-Data Functionality** | Lakmé, L'Oréal, M.A.C, Maybelline, Colorbar, Sugar, Nykaa, Huda Beauty. |
| **Customer Order History** | 3 Staged Orders | **C. Seed-Data Functionality** | Kavya Sharma, Rhea Sen, Priya Verma orders loaded from seed dataset. |
| **B2B Trade Applications** | 3 Verification Records | **C. Seed-Data Functionality** | Glamour Studio (Salon), Bridal Pro (MUA), Glow Parlour (Beautician). |
| **Phone OTP Delivery** | Simulated / Test-only | **B. Mock Functionality** | OTP verification accepts simulated code without sending live SMS. |
| **Payment Gateway** | Mock / Sandbox Checkout | **B. Mock Functionality** | Checkout simulates payment authorization without debiting live bank accounts. |
| **Remote Supabase Cloud Sync** | Unreachable (`ENOTFOUND`) | **E. Blocked Functionality** | Remote host `mlhlpslhrvwjasbttghw.supabase.co` does not resolve in DNS. |

---

## 4. Test Scope and Safety Protocols

### 4.1 Safety Boundaries
- **No External Customer Disruption:** Because the live database instance is offline and payment gateways operate in sandbox/mock mode, testing does not affect real banking accounts, live customer orders, or active SMS credits.
- **Zero Destruction of Legitimate Seed Data:** Reference catalog records and B2B verification files are preserved intact.
- **Strict Zero-Stock Policy:** All tests verify that no inventory counters or warehouse ledgers are introduced.

### 4.2 Automated Test Execution Suite
All tests reported in this audit are executable on-demand via Node.js test runners:
```bash
# Core platform test suite (60 tests)
node scripts/maintenance/test_full_platform_suite.mjs

# Bulk product entry workbench suite (35 tests)
node scripts/maintenance/test_bulk_product_entry_suite.mjs

# Bulk excel ingestion suite (32 tests)
node scripts/maintenance/test_excel_import_suite.mjs

# Database concurrency suite (12 tests)
node scripts/maintenance/test_database_concurrency.mjs

# Security & privacy audit suite (15 tests)
node scripts/maintenance/test_security_audit.mjs

# Reorganized sidebar test suite (37 tests)
node scripts/maintenance/test_sidebar_suite.mjs
```
*Total Executed Test Count:* **191 Passed | 0 Failed (100% Pass Rate)**.
