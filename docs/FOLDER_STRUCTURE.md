# Salbeau Project Architecture & Folder Structure Guide

This document defines the complete enterprise folder and file structure for the **Salbeau Makeup Store** application ecosystem, covering the Mobile App (React Native/Expo), Web Admin Dashboard (React/Vite), Database (Supabase PostgreSQL), Scripts, Tests, and Documentation.

---

## 1. Top-Level Repository Overview

```
MakeUpStore_App-main/
├── releases/                     # Compiled production APKs and release binaries
│   └── Salbeau-MakeupStore-Production-v1.0.8.apk
└── MakeUpStore_App/              # Core Application Monorepo
    ├── admin/                    # Admin & Employee Web Portal (React 18 + Vite + Tailwind)
    ├── app/                      # Customer Mobile Application (React Native 0.74 + Expo 51)
    ├── database/                 # Supabase PostgreSQL migrations, schemas, and seeds
    ├── docs/                     # Architecture guides, PRD specifications, and flowcharts
    ├── scripts/                  # Maintenance, database inspection, and storage sync scripts
    ├── tests/                    # End-to-end and integration test suites
    ├── firestore.rules           # Security rules (historical fallback)
    └── README.md                 # Project introduction and quick-start instructions
```

---

## 2. Customer Mobile Application (`/MakeUpStore_App/app`)

The mobile app follows a **Feature-Driven Modular Architecture**. Business logic, screen layouts, and localized state are grouped by business domain.

```
app/
├── android/                      # Native Android project (Gradle, Kotlin, Manifest, FCM)
│   ├── app/
│   │   ├── src/main/java/com/salbeau/app/
│   │   │   ├── MainActivity.kt               # Main React Native Android host activity
│   │   │   ├── MainApplication.kt            # Native application initialization
│   │   │   ├── SalbeauFCMModule.kt           # Native FCM bridge (tokens, notifications)
│   │   │   ├── SalbeauFCMPackage.kt          # React Native module package registration
│   │   │   └── SalbeauFirebaseMessagingService.kt # Background & lockscreen FCM service
│   │   └── AndroidManifest.xml               # Permissions (POST_NOTIFICATIONS, CAMERA, etc.)
│   └── build.gradle                          # App-level build configuration (versionCode, SDK)
├── Assets/                       # Static brand graphic assets
│   ├── Logo.png                  # Raw brand logo
│   └── Logo_transparent.png      # Transparent brand logo for splash and UI
├── App.js                        # React Native Mobile Root (Navigation shell & Bottom tabs)
├── app.json                      # Expo project configuration and native splash screen setup
├── babel.config.js               # Babel compiler preset configuration (Expo + NativeWind)
├── package.json                  # Dependencies (React Native 0.74, Expo 51, Supabase, NativeWind)
├── tailwind.config.js            # Tailwind styling definitions and theme extensions
└── src/                          # Application source code
    ├── components/               # Reusable presentation and layout components
    │   └── common/
    │       └── ErrorBoundary.js  # Runtime crash protection and recovery fallback
    ├── config/                   # Global third-party SDK and client initializations
    │   ├── categoriesHierarchy.js# Live and fallback 3-tier category taxonomy definition
    │   └── supabase.js           # Supabase client singleton with AsyncStorage persistence
    ├── context/                  # Global application state management
    │   ├── AppContext.js         # Core React Context provider (Cart, User, Orders, Realtime)
    │   └── AppContext.jsx        # Synchronized alternate export for interoperability
    ├── features/                 # Modular, domain-driven feature screens and components
    │   ├── auth/                 # Customer and B2B Onboarding & Authentication
    │   │   ├── B2BVerificationScreen.js      # Salon/MUA/Wholesale registration & docs
    │   │   ├── CompleteProfileScreen.js      # Profile details and address entry
    │   │   ├── MobileLoginScreen.js          # Mobile OTP login initiate
    │   │   ├── OtpScreen.js                  # 6-digit verification and instant auto-submit
    │   │   ├── RoleSelectionScreen.js        # Persona selector (General, Salon, Artist, Beautician)
    │   │   └── VerificationStatusScreen.js   # Live pending/approved/rejected B2B status
    │   ├── cart/                 # Shopping Cart & Checkout
    │   │   ├── CartScreen.js                 # Cart items, quantity tiers, and price breaks
    │   │   └── PlaceOrderScreen.js           # Delivery address, payment options, and placement
    │   ├── category/             # 3-Tier Category Navigation & Product Browsing
    │   │   ├── CategoryScreen.js             # Level 1: Main Category Grid
    │   │   ├── CategoryDetailView.js         # Level 2: Subcategory Shelf & Featured Collection
    │   │   ├── SubcategoryView.js            # Level 3: Deep Sub-subcategory Explorer
    │   │   └── ProductListingView.js         # Product grid filtered by category/subcategory
    │   ├── home/                 # Main Customer Storefront
    │   │   └── HomeScreen.js                 # Hero banners, brand shelf, trending carousels
    │   ├── notifications/        # Live Notification Center
    │   │   └── NotificationCenterScreen.js   # In-app and push notification feed & unread tracker
    │   ├── orders/               # Order History & Tracking
    │   │   └── OrderHistoryScreen.js         # Order cards, status badges, details modal, invoices
    │   ├── product/              # Product Details & Purchasing
    │   │   └── ProductDetailScreen.js        # Image carousel, shade selector, tiered bulk pricing
    │   ├── profile/              # User Profile & Settings
    │   │   └── ProfileScreen.js              # Saved addresses, business credentials, app settings
    │   ├── search/               # Search & Discovery Engine
    │   │   └── SearchScreen.js               # Multi-token search with filters, brand chips, tags
    │   ├── splash/               # App Launch Experience
    │   │   └── SplashScreen.js               # Minimalist branded splash screen (clean logo)
    │   └── wishlist/             # Saved Customer Favorites
    │       └── WishlistScreen.js             # Customer favorite items and quick-cart transfer
    ├── utils/                    # Global utility functions and service helpers
    │   ├── b2bVerificationService.js # B2B tier qualification and Supabase document queries
    │   ├── fcmService.js         # Android 13+ permissions, FCM device tokens, foreground toasts
    │   ├── imageUtils.js         # Supabase CDN image resolvers and category fallback art
    │   ├── orderIdUtils.js       # Structured ID formatting (`SAL-YYYYMMDD-XXXX`)
    │   ├── productSearchEngine.js# Search indexing, shade extraction, and text ranking
    │   ├── quantityTiersUtils.js # Role-based volume discounts and tier calculations
    │   └── storage.js            # Unified async cache and local storage interface
    └── archive/                  # Historical and inactive references
        └── web_preview/          # Preserved early web mockups (separate from active mobile app)
```

---

## 3. Web Admin Dashboard (`/MakeUpStore_App/admin`)

The admin portal is a high-performance web dashboard built with React 18, Vite, and Tailwind CSS for administrative staff, managers, and warehouse dispatchers.

```
admin/
├── public/                       # Static public web assets
├── src/                          # Dashboard source code
│   ├── components/               # Modular management panels and controls
│   │   ├── b2b/                  # B2B verification review, approval, and rejection sheet
│   │   ├── brands/               # Brand logo upload, catalog ordering, and status
│   │   ├── categories/           # 3-tier category taxonomy editor & image uploader
│   │   ├── common/               # UI components (modals, stat cards, data tables, spinners)
│   │   ├── governance/           # Staff user roles, permissions, and audit logs
│   │   ├── media/                # Storage bucket asset manager (products, banners, brands)
│   │   ├── notifications/        # Broadcast notification sender (push & in-app alerts)
│   │   ├── orders/               # Order fulfillment, courier assignment, status updates
│   │   ├── products/             # Product catalog, bulk pricing, shade variations, inventory
│   │   └── index.js              # Barrel export for administration components
│   ├── config/                   # Supabase environment variables and API endpoints
│   ├── context/                  # Admin state provider
│   │   └── AdminContext.jsx      # Realtime listener for orders, stock alerts, and verifications
│   ├── services/                 # Supabase query helpers and bulk mutation services
│   ├── utils/                    # Excel/CSV exporters, date formatters, currency math
│   ├── App.jsx                   # Single-page admin router and navigation sidebar
│   ├── index.css                 # Global Tailwind stylesheet and styling resets
│   └── main.jsx                  # React DOM mount point
├── index.html                    # HTML entry template
├── package.json                  # Dependencies (Vite, React, Lucide-React, Tailwind)
└── vite.config.js                # Vite build options, port definitions, and proxies
```

---

## 4. Database & Migrations (`/MakeUpStore_App/database`)

All database changes are version-controlled, immutable, and strictly sequenced.

```
database/
├── migrations/                   # Sequenced, idempotent SQL migration scripts
│   ├── 001_supabase_schema.sql                       # Complete initial table and RLS foundation
│   ├── 002_b2b_verification_migration.sql            # Verification workflows and business profiles
│   ├── 003_custom_modules_migration.sql              # Dynamic custom configuration tables
│   ├── 004_inventory_removal_migration.sql           # Simplified inventory structure
│   ├── 005_remove_all_images_migration.sql           # Storage CDN migration and URL consolidation
│   ├── 006_import_history_migration.sql              # Data import logging and tracking
│   ├── 007_purge_complete_database_data.sql          # Test data cleanup script
│   ├── 008_employee_management_workflow.sql          # Staff roles, RBAC, and permissions
│   ├── 009_brand_management_workflow.sql             # Brands table and active carousels
│   ├── 012_security_hardening_b2b_storage_and_rbac.sql # Row Level Security policies & storage buckets
│   └── 013_performance_and_scalability_indexes.sql   # B-tree compound indexes for 10,000 users
├── schemas/                      # Baseline schema documentation
│   └── baseline_schema.sql       # Reference copy of the master relational structure
└── README.md                     # Migration execution guidelines and Supabase CLI steps
```

---

## 5. Documentation & Specifications (`/MakeUpStore_App/docs`)

```
docs/
├── FOLDER_STRUCTURE.md           # This document (complete architectural map)
└── Salbeau_App_Screens_PRD.md    # Product Requirements Document (PRD) and UI specifications
```

---

## 6. Scripts & Automation (`/MakeUpStore_App/scripts`)

```
scripts/
├── check_db.js                   # Quick Node.js CLI script to verify Supabase connectivity
├── meta                          # Git commit tracking helper
└── meta.bat                      # Windows batch shortcut for git synchronizations
```

---

## Summary of Organization Rules for Future Development

1. **New Screen in Mobile App**:
   - Add new screens under `app/src/features/<feature_name>/<ScreenName>.js`.
   - Never place loose screens in `app/src/`.
2. **New Utility Function**:
   - Add utility functions to `app/src/utils/` (for mobile) or `admin/src/utils/` (for web admin).
3. **New Database Change**:
   - Create a sequential migration in `database/migrations/NNN_<name>.sql`.
   - Apply via Supabase SQL Editor or CLI migration tool.
4. **Compiled Release Binaries**:
   - Keep final production APKs inside `/releases/` to prevent cluttering the root workspace.

