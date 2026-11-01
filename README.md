# 💄 SALBEAU MAKEUPSTORE — ENTERPRISE E-COMMERCE PLATFORM

> **Premium Multi-Tier Wholesale & Retail Beauty Commerce Architecture**  
> Powered by React 18, Vite 5, React Native (Expo SDK 51), and Supabase PostgreSQL.

---

## 🌟 Executive Summary

**Salbeau MakeUpStore** is a state-of-the-art beauty and cosmetics e-commerce platform built for high-performance multi-tier commerce. It bridges the gap between direct-to-consumer (D2C) retail beauty shopping and high-volume business-to-business (B2B) salon and distributor wholesale trade.

### Key Highlights
- 🎨 **Multi-Tier Role-Based Pricing:** Native 4-tier pricing matrix (`Retail`, `Wholesale / Silver`, `Distributor / Gold`, `VIP / Diamond`) with volume quantity tiers.
- 💅 **Parent-Child Catalog Architecture:** Master parent products with dynamic shade variants, hex color swatches, barcode mapping, and rich beauty metadata.
- 📦 **Zero-Stock Inventory Policy:** Streamlined merchandising architecture with zero stock tracking, finite warehouse counts, or low-stock blockers.
- 🪪 **B2B Trade Verification:** End-to-end B2B trade account registration, tax ID / business license document upload, and administrative verification lifecycle.
- ⚡ **Centralized Image Dropzone & WebP Optimizer:** Multi-source asset ingest supporting local file drag & drop, direct URL import, clipboard paste (Ctrl+V), and Google Images search with auto WebP compression.
- 🛡️ **Role-Based Governance & RBAC:** Comprehensive administrative employee management, granular permission matrices, approval workflows, and immutable audit logging.

---

## 📁 Repository Structure

For the exhaustive architectural reference, see [**docs/FOLDER_STRUCTURE.md**](docs/FOLDER_STRUCTURE.md).

```
MakeUpStore_App-main/
├── releases/                      # 📦 Production release binaries (APKs)
└── MakeUpStore_App/
    ├── admin/                     # 🖥️ Admin Management Console (React 18 + Vite 5)
    │   └── src/
    │       ├── components/        # Domain-driven management components (b2b, orders, products, etc.)
    │       ├── config/            # Supabase API client & configuration
    │       ├── context/           # AdminContext state provider & realtime listeners
    │       └── utils/             # Exporters, formatters, and permission helpers
    │
    ├── app/                       # 📱 Customer Mobile Application (React Native / Expo 51)
    │   ├── android/               # Native Android project (Kotlin, Manifest, Native FCM)
    │   ├── Assets/                # Static brand assets (Logo, transparent splash logo)
    │   ├── App.js                 # Mobile root entry point, navigation shell & bottom tabs
    │   └── src/
    │       ├── components/        # Error boundaries and shared presentation components
    │       ├── config/            # Supabase singleton & 3-tier category taxonomy
    │       ├── context/           # AppContext state provider (Cart, User, Realtime sync)
    │       ├── features/          # Feature-driven modular screens (auth, home, product, cart, orders)
    │       ├── utils/             # Push notification service, tier pricing, search engine
    │       └── archive/           # Archived early web preview references
    │
    ├── database/                  # 🗄️ Database Architecture & Migrations
    │   ├── migrations/            # Version-controlled SQL migrations (001 through 013)
    │   ├── schemas/               # Baseline master relational schema reference
    │   └── README.md              # Database migration instructions & Supabase CLI guide
    │
    ├── docs/                      # 📚 Engineering Documentation & PRDs
    │   ├── FOLDER_STRUCTURE.md    # Complete folder, subfolder & sub-subfolder guide
    │   └── Salbeau_App_Screens_PRD.md # Product Requirements Document
    │
    └── scripts/                   # 🛠️ Maintenance & Diagnostic Automation
        ├── check_db.js            # Node.js CLI database connection verification
        └── meta.bat               # Git synchronization utility
```
│   ├── architecture/
│   │   ├── TARGET_FOLDER_STRUCTURE.md
│   │   └── FILE_MIGRATION_MAP.md
│   ├── audit/
│   │   └── COMPLETE_PROJECT_AUDIT.md
│   └── development/
│       ├── CODING_CONVENTIONS.md
│       ├── PROJECT_SETUP.md
│       ├── TESTING_GUIDE.md
│       └── TROUBLESHOOTING.md
│
└── archive/                       # 📦 Historical Legacy Prototypes
    └── legacy/                    # Deprecated single-file experiments & early prototypes
```

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- Node.js 18+ or 20+ LTS
- npm 9+
- Supabase project credentials

### 2. Run Admin Panel
```bash
cd admin
npm install
npm run dev
```
Open **`http://localhost:3001`** in your browser.

To verify production compilation:
```bash
npm run build
```

### 3. Run Mobile Application
```bash
cd app
npm install
npm start
```
- Press **`w`** for Web preview.
- Scan QR code using **Expo Go** on iOS / Android.

---

## 📖 Complete Documentation Index

| Guide | Description |
|---|---|
| [COMPLETE_PROJECT_AUDIT.md](file:///e:/MakeUpStore_App-main/MakeUpStore_App/docs/audit/COMPLETE_PROJECT_AUDIT.md) | Exhaustive repository audit, dead-code detection, and health assessment |
| [TARGET_FOLDER_STRUCTURE.md](file:///e:/MakeUpStore_App-main/MakeUpStore_App/docs/architecture/TARGET_FOLDER_STRUCTURE.md) | Detailed folder architecture, domain boundaries, and file placement rules |
| [FILE_MIGRATION_MAP.md](file:///e:/MakeUpStore_App-main/MakeUpStore_App/docs/architecture/FILE_MIGRATION_MAP.md) | Old-to-new file path mappings, import impact, and risk classifications |
| [CODING_CONVENTIONS.md](file:///e:/MakeUpStore_App-main/MakeUpStore_App/docs/development/CODING_CONVENTIONS.md) | Architectural rules, naming conventions, path aliases, and domain standards |
| [PROJECT_SETUP.md](file:///e:/MakeUpStore_App-main/MakeUpStore_App/docs/development/PROJECT_SETUP.md) | Developer onboarding, environment variables, and Supabase database initialization |
| [TESTING_GUIDE.md](file:///e:/MakeUpStore_App-main/MakeUpStore_App/docs/development/TESTING_GUIDE.md) | Production build checks, manual QA verification matrices, and regression tests |
| [TROUBLESHOOTING.md](file:///e:/MakeUpStore_App-main/MakeUpStore_App/docs/development/TROUBLESHOOTING.md) | Common errors, solutions, port conflicts, Supabase RLS policies, and scanner configs |
| [Database README](file:///e:/MakeUpStore_App-main/MakeUpStore_App/database/README.md) | Sequenced SQL migration guide, RLS policies, and storage bucket configuration |
| [Scripts README](file:///e:/MakeUpStore_App-main/MakeUpStore_App/scripts/README.md) | Guide to diagnostic and database maintenance scripts |
| [Archive README](file:///e:/MakeUpStore_App-main/MakeUpStore_App/archive/legacy/README.md) | Index of retired legacy prototypes and rationale for archival |

---

## 🔒 Architectural & Business Commitments

1. **Zero Stock Tracking:** The platform does not track stock quantities, warehouse bins, or low-stock alerts. Merchandising visibility is controlled via binary status and stock toggles.
2. **Four Role Prices:** Retail, Wholesale, Distributor, VIP pricing structures are first-class columns across products and variants.
3. **Safe Reorganization:** 100% of business logic, barcode scanner workflows, dynamic variant builder, and B2B verification preserved.
