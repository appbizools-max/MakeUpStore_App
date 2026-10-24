# SALBEAU MAKEUPSTORE — TARGET FOLDER STRUCTURE

**Status:** Approved Target Architecture  
**Date:** 2026-10-24  
**Architect:** Principal Software Architect  

---

## 1. Overview & Architectural Goals

The goal of this target folder structure is to establish clear boundaries, intuitive discoverability, zero dead code in active source trees, modular feature-based component organization, and standardized naming conventions while preserving 100% of existing application behavior and business rules.

---

## 2. Complete Target Directory Tree

```
MakeUpStore_App/
├── README.md                                    # Master project documentation
├── Salbeau_App_Screens_PRD.md                   # Mobile application product requirements
├── firestore.rules                              # Cloud Firestore security rules
│
├── database/                                    # DATABASE SCHEMA & MIGRATIONS
│   ├── README.md                                # Database setup & execution sequence
│   └── migrations/                              # Numbered chronological migrations
│       ├── 001_supabase_schema.sql             # Base PostgreSQL schema
│       ├── 002_b2b_verification.sql            # B2B verification workflows
│       ├── 003_custom_modules.sql              # Governance, approvals, staged ops
│       ├── 004_inventory_removal.sql           # Complete inventory removal
│       └── 005_remove_all_images.sql           # Database image purge migration
│
├── docs/                                        # CENTRALIZED DOCUMENTATION
│   ├── audit/
│   │   └── COMPLETE_PROJECT_AUDIT.md           # Full initial repository audit
│   ├── architecture/
│   │   ├── TARGET_FOLDER_STRUCTURE.md          # Approved folder design
│   │   └── FILE_MIGRATION_MAP.md               # File-by-file old-to-new mapping
│   └── development/
│       ├── CODING_CONVENTIONS.md               # Naming & coding standards
│       ├── PROJECT_SETUP.md                    # Environment & local launch guide
│       ├── TESTING_GUIDE.md                    # Verification & build procedures
│       └── TROUBLESHOOTING.md                  # Common issues & operational fixes
│
├── scripts/                                     # DEVELOPMENT & MAINTENANCE SCRIPTS
│   ├── README.md                                # Script usage documentation
│   ├── database/
│   │   ├── verify_supabase_audit.js            # Database schema health auditor
│   │   ├── test_db.mjs                         # Connection & query tester
│   │   ├── test_sql.mjs                        # SQL execution probe
│   │   └── inspect_images.mjs                  # Image column diagnostic inspector
│   └── maintenance/
│       ├── clean_fallbacks.mjs                 # Stock photo fallback purge utility
│       ├── clean_hierarchy.mjs                 # Hierarchy cache cleaning tool
│       ├── apply_admin_theme_and_search.js     # Admin visual styling tuner
│       └── harmonize_components_theme.js       # Component aesthetic synchronizer
│
├── archive/                                     # SAFE CODE ARCHIVAL
│   └── legacy/                                  # Confirmed obsolete files
│       ├── README.md                            # Removal rationale & replacement guide
│       ├── AddNewProductPage.jsx                # Superseded by AddNewProductPage_Redesigned
│       ├── CategorySubcategoryManager.jsx       # Superseded by MainCategoriesManager
│       ├── UniversalVariantBuilder.jsx          # Superseded by DynamicVariantBuilder
│       ├── BrowseConsoleModal.jsx               # Obsolete prototype modal
│       ├── InlineImageSearchPanel.jsx           # Superseded by InlineImageSection
│       ├── InlineShadeCard.jsx                  # Superseded by DynamicVariantBuilder swatches
│       ├── ProductDiscoveryAndRichData.jsx      # Prototype rich data panel
│       ├── RowAttributeModal.jsx                # Obsolete matrix row modal
│       ├── RowImageUploadModal.jsx              # Obsolete matrix row upload modal
│       ├── RowQuantityTierModal.jsx             # Obsolete matrix row quantity modal
│       └── SmartAttributeSuggestionPanel.jsx    # Obsolete suggestion panel
│
├── admin/                                       # ADMIN PANEL (React + Vite + Tailwind)
│   ├── package.json
│   ├── package-lock.json
│   ├── vite.config.js
│   ├── index.html
│   ├── postcss.config.js
│   ├── tailwind.config.js
│   ├── public/
│   │   ├── favicon.ico
│   │   ├── favicon.svg
│   │   └── banners/
│   └── src/
│       ├── main.jsx                             # Application bootstrap
│       ├── App.jsx                              # Shell layout, tab routing & active modals
│       ├── index.css                            # Global CSS tokens & Tailwind directives
│       ├── firebase.js                          # Firebase fallback initialization
│       ├── Assets/Logo.png                      # Salbeau branding logo
│       ├── config/
│       │   ├── firebase.js                      # Firebase client config
│       │   └── supabase.js                      # Supabase client config & admin client
│       ├── context/
│       │   └── AdminContext.jsx                 # Global store & Supabase data subscriptions
│       ├── services/                            # Business & integration services
│       │   ├── aiColorService.js                # Color name generator from HEX
│       │   ├── barcodeLookupService.js          # Web barcode lookups
│       │   ├── excelProcessorService.js         # SheetJS Excel import/export engine
│       │   ├── imageSearchService.js            # External image search integrations
│       │   └── productEngineService.js          # Product validation & slug engine
│       ├── utils/                               # Helper functions & domain utilities
│       │   ├── attributeMasterData.js           # Beauty attributes suggestions
│       │   ├── b2bVerificationService.js        # B2B verification logic
│       │   ├── barcodeUtils.js                  # EAN/UPC barcode validation
│       │   ├── customerSearchService.js         # Customer search logging
│       │   ├── excelTemplateGenerator.js        # Excel template creator
│       │   ├── imageOptimizer.js                # Client image resizing & compression
│       │   ├── orderIdUtils.js                  # Order ID formatting
│       │   ├── permissionEngine.js              # RBAC module access evaluator
│       │   ├── productDescriptionGenerator.js   # Description generator
│       │   ├── productRichDataEngine.js         # Rich product metadata engine
│       │   ├── productSearchEngine.js           # Multi-criteria search engine
│       │   ├── quantityTiersUtils.js            # Wholesale volume discount rules
│       │   ├── useHardwareBarcodeScanner.js     # Physical HID scanner hook
│       │   └── useVirtualScroll.js              # Virtual table row scrolling hook
│       └── components/                          # MODULAR FEATURE COMPONENTS
│           ├── products/                        # Product catalog & creation
│           │   ├── AddNewProductPage_Redesigned.jsx
│           │   ├── ProductsCatalogMatrix.jsx
│           │   ├── DynamicVariantBuilder.jsx
│           │   ├── ProductFormRightPanel.jsx
│           │   ├── BarcodeScannerModal.jsx
│           │   ├── BarcodeSearchResultModal.jsx
│           │   ├── BarcodeLookupReviewModal.jsx
│           │   ├── BulkProductEntryModal.jsx
│           │   ├── ExcelImportModal.jsx
│           │   ├── ColumnManagerModal.jsx
│           │   ├── ShadePricingModal.jsx
│           │   ├── RolePricingMatrix.jsx
│           │   ├── RoleQuantityTiersManager.jsx
│           │   ├── GeneratedDataPanel.jsx
│           │   └── preview/                     # Form step preview widgets
│           │       ├── MerchandisingPreviewCard.jsx
│           │       ├── NumberedStepHeader.jsx
│           │       ├── PricingPreviewCard.jsx
│           │       ├── ProductPreviewCard.jsx
│           │       └── QuantityDiscountPreviewCard.jsx
│           ├── categories/                      # Hierarchies & Taxonomies
│           │   ├── MainCategoriesManager.jsx    # 3-level Category Manager
│           │   └── AttributesMasterPage.jsx     # Attribute taxonomy editor
│           ├── media/                           # Asset management & Uploads
│           │   ├── ImageManagerModal.jsx        # Sticky modal with ✕ close
│           │   ├── ImageDropzoneUploader.jsx    # Drag, drop & paste uploader
│           │   ├── ImageField.jsx               # Form image trigger
│           │   └── InlineImageSection.jsx       # Inline image editor
│           ├── orders/                          # Order fulfillment & Carts
│           │   ├── FulfillmentStatusSelector.jsx
│           │   └── AbandonedCartsManager.jsx
│           ├── b2b/                             # B2B & Wholesale Verification
│           │   ├── B2BVerificationPage.jsx
│           │   └── CustomerSearchRequestsPage.jsx
│           ├── governance/                      # Enterprise RBAC & Security
│           │   ├── ApprovalCenterPage.jsx
│           │   ├── AuditTrailPage.jsx
│           │   └── employees/                   # Employee management
│           │       ├── AddEmployeePage.jsx
│           │       ├── AllEmployeesPage.jsx
│           │       ├── EditEmployeePage.jsx
│           │       ├── EmployeeActivityPage.jsx
│           │       ├── EmployeePermissionsPage.jsx
│           │       └── EmployeeProfilePage.jsx
│           └── common/                          # Reusable UI controls
│               ├── HexColorPicker.jsx
│               └── SearchableSelect.jsx
│
└── app/                                         # MOBILE APP (React Native Expo + Web Preview)
    ├── package.json
    ├── package-lock.json
    ├── app.json                                 # Expo configuration
    ├── App.js                                   # React Native root shell
    ├── babel.config.js
    ├── metro.config.js
    ├── tailwind.config.js
    ├── index.html                               # Web preview index
    ├── google-services.json                     # Firebase Android config
    ├── android/                                 # Native Android source
    ├── Assets/                                  # Static banners & category assets
    └── src/
        ├── main.jsx                             # Web preview bootstrap
        ├── App.jsx                              # Web preview shell
        ├── index.css
        ├── firebase.js
        ├── config/
        │   ├── categoriesHierarchy.js           # 3-level taxonomy hierarchy
        │   ├── firebase.js
        │   └── supabase.js
        ├── context/
        │   ├── AppContext.js                    # React Native store (AsyncStorage)
        │   └── AppContext.jsx                   # Web preview store (localStorage)
        ├── features/                            # React Native feature screens
        │   ├── auth/
        │   ├── cart/
        │   ├── category/
        │   ├── home/
        │   ├── orders/
        │   ├── product/
        │   ├── profile/
        │   ├── search/
        │   ├── splash/
        │   └── wishlist/
        ├── screens/                             # React DOM web preview screens
        │   ├── B2BVerificationScreen.jsx
        │   ├── BrandScreen.jsx
        │   ├── CartScreen.jsx
        │   ├── CategoryScreen.jsx
        │   ├── CompleteProfileScreen.jsx
        │   ├── HomeScreen.jsx
        │   ├── MobileLoginScreen.jsx
        │   ├── OnboardingScreen.jsx
        │   ├── OrderConfirmationScreen.jsx
        │   ├── OrderHistoryScreen.jsx
        │   ├── OtpScreen.jsx
        │   ├── PlaceOrderScreen.jsx
        │   ├── ProductDetailScreen.jsx
        │   ├── ProfileScreen.jsx
        │   ├── SearchScreen.jsx
        │   ├── SplashScreen.jsx
        │   ├── VerificationStatusScreen.jsx
        │   └── WishlistScreen.jsx
        └── utils/                               # Mobile business utilities
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

## 3. Organizational Rules

1. **Feature Separation**: Admin components are organized strictly by functional domain: `products/`, `categories/`, `media/`, `orders/`, `b2b/`, `governance/`, `common/`.
2. **Zero Dead Code**: Unused prototypes are archived with full explanations in `archive/legacy/`.
3. **Dedicated Database Directory**: SQL migrations are numbered chronologically in `database/migrations/`.
4. **Maintenance Utilities**: Diagnostic and cleaning scripts are isolated in `scripts/`.
5. **No Regressions**: All existing imports and paths are updated cleanly, and builds are verified before finalizing.
