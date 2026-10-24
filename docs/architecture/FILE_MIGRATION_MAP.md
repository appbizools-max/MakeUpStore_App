# SALBEAU MAKEUPSTORE — FILE MIGRATION & REORGANIZATION PLAN

**Status:** Implementation Blueprint  
**Date:** 2026-10-24  
**Author:** Principal Software Architect  

---

## 1. Migration Strategy & Safety Rules

1. **Non-Destructive Moves**: No active code will be deleted. Unused prototypes are transferred to `archive/legacy/` with explanations.
2. **Atomic Batches**: Files are reorganized in small, logical batches with import verification after every batch.
3. **Dual Import Safety**: Direct imports in `App.jsx` and other consumers will be updated to point to the new modular locations, and a comprehensive barrel index `admin/src/components/index.js` will be maintained to guarantee resolution safety.
4. **Build Validation**: Each phase is validated with `npm run build` in `admin/` to ensure 0 compile warnings or bundling errors.

---

## 2. Complete File Migration Mapping

### Batch 1: Obsolete & Prototype Component Archival

| # | Current Location | New Destination | Responsibility & Reason | Dependencies Affected | Risk |
| :- | :--- | :--- | :--- | :--- | :--- |
| 1 | `admin/src/components/AddNewProductPage.jsx` | `archive/legacy/AddNewProductPage.jsx` | Legacy 1st-gen product creation modal; replaced by `AddNewProductPage_Redesigned.jsx`. | None (0 imports). | Very Low |
| 2 | `admin/src/components/CategorySubcategoryManager.jsx` | `archive/legacy/CategorySubcategoryManager.jsx` | 2-level category manager prototype; superseded by 3-level `MainCategoriesManager.jsx`. | Line 100 of `App.jsx` (unused import). | Low |
| 3 | `admin/src/components/UniversalVariantBuilder.jsx` | `archive/legacy/UniversalVariantBuilder.jsx` | Experimental variant generator prototype; superseded by `DynamicVariantBuilder.jsx`. | None (0 imports). | Very Low |
| 4 | `admin/src/components/BrowseConsoleModal.jsx` | `archive/legacy/BrowseConsoleModal.jsx` | Obsolete debugging modal. | None (0 imports). | Very Low |
| 5 | `admin/src/components/InlineImageSearchPanel.jsx` | `archive/legacy/InlineImageSearchPanel.jsx` | Early image search panel; superseded by `InlineImageSection.jsx`. | None (0 imports). | Very Low |
| 6 | `admin/src/components/InlineShadeCard.jsx` | `archive/legacy/InlineShadeCard.jsx` | Prototype shade card; embedded directly in `DynamicVariantBuilder.jsx`. | None (0 imports). | Very Low |
| 7 | `admin/src/components/ProductDiscoveryAndRichData.jsx` | `archive/legacy/ProductDiscoveryAndRichData.jsx` | Standalone rich data panel prototype; integrated into main product editor. | None (0 imports). | Very Low |
| 8 | `admin/src/components/RowAttributeModal.jsx` | `archive/legacy/RowAttributeModal.jsx` | Early matrix row modal; replaced by inline attribute editors. | None (0 imports). | Very Low |
| 9 | `admin/src/components/RowImageUploadModal.jsx` | `archive/legacy/RowImageUploadModal.jsx` | Early matrix row upload modal; replaced by `ImageManagerModal.jsx`. | None (0 imports). | Very Low |
| 10 | `admin/src/components/RowQuantityTierModal.jsx` | `archive/legacy/RowQuantityTierModal.jsx` | Early matrix row quantity modal; replaced by `RoleQuantityTiersManager.jsx`. | None (0 imports). | Very Low |
| 11 | `admin/src/components/SmartAttributeSuggestionPanel.jsx` | `archive/legacy/SmartAttributeSuggestionPanel.jsx` | Prototype suggestion panel; incorporated into `attributeMasterData.js`. | None (0 imports). | Very Low |

---

### Batch 2: Diagnostic & Maintenance Scripts

| # | Current Location | New Destination | Responsibility & Reason | Risk |
| :- | :--- | :--- | :--- | :--- |
| 1 | `admin/inspect_images.mjs` | `scripts/database/inspect_images.mjs` | Database image inspection tool. | Very Low |
| 2 | `admin/test_db.mjs` | `scripts/database/test_db.mjs` | Direct Supabase connection probe. | Very Low |
| 3 | `admin/test_sql.mjs` | `scripts/database/test_sql.mjs` | SQL query executor probe. | Very Low |
| 4 | `admin/verify_supabase_audit.js` | `scripts/database/verify_supabase_audit.js` | Schema table & column auditor. | Very Low |
| 5 | `scratch/clean_fallbacks.mjs` | `scripts/maintenance/clean_fallbacks.mjs` | Fallback stock image cleaner. | Very Low |
| 6 | `scratch/clean_hierarchy.mjs` | `scripts/maintenance/clean_hierarchy.mjs` | Hierarchy cache image stripper. | Very Low |
| 7 | `scratch/apply_admin_theme_and_search.js` | `scripts/maintenance/apply_admin_theme_and_search.js` | Admin theme harmonizer. | Very Low |
| 8 | `scratch/harmonize_components_theme.js` | `scripts/maintenance/harmonize_components_theme.js` | Styling consistency script. | Very Low |

---

### Batch 3: Database Migrations Organization

| # | Current Location | New Destination | Responsibility & Sequence |
| :- | :--- | :--- | :--- |
| 1 | `supabase_schema.sql` | `database/migrations/001_supabase_schema.sql` | Initial PostgreSQL database baseline. |
| 2 | `supabase_b2b_verification_migration.sql` | `database/migrations/002_b2b_verification_migration.sql` | B2B verification documents, audit tables, triggers. |
| 3 | `supabase_custom_modules_migration.sql` | `database/migrations/003_custom_modules_migration.sql` | Employee permissions, staged operations, activity logs. |
| 4 | `supabase_inventory_removal_migration.sql` | `database/migrations/004_inventory_removal_migration.sql` | Complete removal of inventory columns and triggers. |
| 5 | `supabase_remove_all_images_migration.sql` | `database/migrations/005_remove_all_images_migration.sql` | Total database image & fallback wipe script. |

*(Note: Copies will be retained at the root directory to guarantee continuous operation of any existing CI or deployment scripts).*

---

### Batch 4: Admin Panel Feature-Based Modularization

#### A. Products Module (`admin/src/components/products/`)
| Source File | Target Path | Consumers to Update |
| :--- | :--- | :--- |
| `admin/src/components/AddNewProductPage_Redesigned.jsx` | `admin/src/components/products/AddNewProductPage_Redesigned.jsx` | `admin/src/App.jsx` |
| `admin/src/components/ProductsCatalogMatrix.jsx` | `admin/src/components/products/ProductsCatalogMatrix.jsx` | `admin/src/App.jsx` |
| `admin/src/components/DynamicVariantBuilder.jsx` | `admin/src/components/products/DynamicVariantBuilder.jsx` | `AddNewProductPage_Redesigned.jsx` |
| `admin/src/components/ProductFormRightPanel.jsx` | `admin/src/components/products/ProductFormRightPanel.jsx` | `AddNewProductPage_Redesigned.jsx` |
| `admin/src/components/BarcodeScannerModal.jsx` | `admin/src/components/products/BarcodeScannerModal.jsx` | `admin/src/App.jsx`, `ProductsCatalogMatrix.jsx` |
| `admin/src/components/BarcodeSearchResultModal.jsx` | `admin/src/components/products/BarcodeSearchResultModal.jsx` | `admin/src/App.jsx` |
| `admin/src/components/BarcodeLookupReviewModal.jsx` | `admin/src/components/products/BarcodeLookupReviewModal.jsx` | `AddNewProductPage_Redesigned.jsx` |
| `admin/src/components/BulkProductEntryModal.jsx` | `admin/src/components/products/BulkProductEntryModal.jsx` | `admin/src/App.jsx` |
| `admin/src/components/ExcelImportModal.jsx` | `admin/src/components/products/ExcelImportModal.jsx` | `ProductsCatalogMatrix.jsx` |
| `admin/src/components/ColumnManagerModal.jsx` | `admin/src/components/products/ColumnManagerModal.jsx` | `BulkProductEntryModal.jsx` |
| `admin/src/components/ShadePricingModal.jsx` | `admin/src/components/products/ShadePricingModal.jsx` | `admin/src/App.jsx`, `ProductsCatalogMatrix.jsx` |
| `admin/src/components/RolePricingMatrix.jsx` | `admin/src/components/products/RolePricingMatrix.jsx` | `admin/src/App.jsx`, `AddNewProductPage_Redesigned.jsx` |
| `admin/src/components/RoleQuantityTiersManager.jsx` | `admin/src/components/products/RoleQuantityTiersManager.jsx` | `admin/src/App.jsx`, `AddNewProductPage_Redesigned.jsx` |
| `admin/src/components/GeneratedDataPanel.jsx` | `admin/src/components/products/GeneratedDataPanel.jsx` | `admin/src/App.jsx` |
| `admin/src/components/redesign/*` | `admin/src/components/products/preview/*` | `AddNewProductPage_Redesigned.jsx` |

#### B. Categories Module (`admin/src/components/categories/`)
| Source File | Target Path | Consumers to Update |
| :--- | :--- | :--- |
| `admin/src/components/MainCategoriesManager.jsx` | `admin/src/components/categories/MainCategoriesManager.jsx` | `admin/src/App.jsx` |
| `admin/src/components/AttributesMasterPage.jsx` | `admin/src/components/categories/AttributesMasterPage.jsx` | `admin/src/App.jsx` |

#### C. Media Module (`admin/src/components/media/`)
| Source File | Target Path | Consumers to Update |
| :--- | :--- | :--- |
| `admin/src/components/ImageManagerModal.jsx` | `admin/src/components/media/ImageManagerModal.jsx` | `ImageField.jsx`, `ImageDropzoneUploader.jsx` |
| `admin/src/components/ImageDropzoneUploader.jsx` | `admin/src/components/media/ImageDropzoneUploader.jsx` | `AddNewProductPage_Redesigned.jsx` |
| `admin/src/components/ImageField.jsx` | `admin/src/components/media/ImageField.jsx` | `admin/src/App.jsx` |
| `admin/src/components/InlineImageSection.jsx` | `admin/src/components/media/InlineImageSection.jsx` | `MainCategoriesManager.jsx` |

#### D. Orders Module (`admin/src/components/orders/`)
| Source File | Target Path | Consumers to Update |
| :--- | :--- | :--- |
| `admin/src/components/FulfillmentStatusSelector.jsx` | `admin/src/components/orders/FulfillmentStatusSelector.jsx` | `admin/src/App.jsx` |
| `admin/src/components/AbandonedCartsManager.jsx` | `admin/src/components/orders/AbandonedCartsManager.jsx` | `admin/src/App.jsx` |

#### E. B2B & Wholesale Module (`admin/src/components/b2b/`)
| Source File | Target Path | Consumers to Update |
| :--- | :--- | :--- |
| `admin/src/components/B2BVerificationPage.jsx` | `admin/src/components/b2b/B2BVerificationPage.jsx` | `admin/src/App.jsx` |
| `admin/src/components/CustomerSearchRequestsPage.jsx` | `admin/src/components/b2b/CustomerSearchRequestsPage.jsx` | `admin/src/App.jsx` |

#### F. Governance & Employees Module (`admin/src/components/governance/`)
| Source File | Target Path | Consumers to Update |
| :--- | :--- | :--- |
| `admin/src/components/ApprovalCenterPage.jsx` | `admin/src/components/governance/ApprovalCenterPage.jsx` | `admin/src/App.jsx` |
| `admin/src/components/AuditTrailPage.jsx` | `admin/src/components/governance/AuditTrailPage.jsx` | `admin/src/App.jsx` |
| `admin/src/components/employees/*` | `admin/src/components/governance/employees/*` | `admin/src/App.jsx` |

#### G. Reusable Controls (`admin/src/components/common/`)
| Source File | Target Path | Consumers to Update |
| :--- | :--- | :--- |
| `admin/src/components/HexColorPicker.jsx` | `admin/src/components/common/HexColorPicker.jsx` | `admin/src/App.jsx`, `DynamicVariantBuilder.jsx` |
| `admin/src/components/SearchableSelect.jsx` | `admin/src/components/common/SearchableSelect.jsx` | `admin/src/App.jsx`, `MainCategoriesManager.jsx` |

---

## 3. Post-Migration Verification Checklist

- [ ] All target subdirectories created.
- [ ] Obsolete files archived with `archive/legacy/README.md`.
- [ ] Scripts copied to `scripts/database/` and `scripts/maintenance/`.
- [ ] Database migrations copied to `database/migrations/` with sequence prefix.
- [ ] Admin components organized by feature module.
- [ ] `admin/src/components/index.js` barrel exported with all module components.
- [ ] Direct import paths in `App.jsx` updated and verified.
- [ ] Cross-component relative imports updated (e.g. `DynamicVariantBuilder`, `ImageDropzoneUploader`, `MainCategoriesManager`).
- [ ] `npm run build` executed in `admin/` — verified 0 compilation errors.
- [ ] Local server tested on `http://localhost:3001/admin/categories`.
