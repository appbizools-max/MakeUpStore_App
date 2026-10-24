# SALBEAU MAKEUPSTORE — ARCHIVED LEGACY CODE & PROTOTYPES

**Archive Date:** 2026-10-24  
**Auditor:** Principal Software Architect  
**Preservation Policy:** These files have been retired from active compilation to ensure maintainability, reduce cognitive load, and eliminate obsolete logic. They are safely preserved in Git history and in this archive directory for reference.

---

## Catalog of Archived Items

| File Name | Original Path | Removal Rationale & Current Active Replacement |
| :--- | :--- | :--- |
| `AddNewProductPage.jsx` | `admin/src/components/AddNewProductPage.jsx` | **Superseded by `AddNewProductPage_Redesigned.jsx`**. This was the unredesigned legacy product creation page prior to the 4-step wizard UI. |
| `CategorySubcategoryManager.jsx` | `admin/src/components/CategorySubcategoryManager.jsx` | **Superseded by `MainCategoriesManager.jsx`**. Legacy 2-level category manager with mock fallbacks. Replaced by the 3-level Category Hierarchy Manager. |
| `UniversalVariantBuilder.jsx` | `admin/src/components/UniversalVariantBuilder.jsx` | **Superseded by `DynamicVariantBuilder.jsx`**. Early experimental prototype for product variants. |
| `BrowseConsoleModal.jsx` | `admin/src/components/BrowseConsoleModal.jsx` | **Obsolete debug tool**. Early diagnostic prototype not utilized in production. |
| `InlineImageSearchPanel.jsx` | `admin/src/components/InlineImageSearchPanel.jsx` | **Superseded by `InlineImageSection.jsx`**. Early in-app search panel with hardcoded stock libraries. |
| `InlineShadeCard.jsx` | `admin/src/components/InlineShadeCard.jsx` | **Embedded in `DynamicVariantBuilder.jsx`**. Standalone shade card was merged into the active variant table. |
| `ProductDiscoveryAndRichData.jsx` | `admin/src/components/ProductDiscoveryAndRichData.jsx` | **Superseded by `GeneratedDataPanel.jsx`** and the main product form right panel. |
| `RowAttributeModal.jsx` | `admin/src/components/RowAttributeModal.jsx` | **Obsolete**. Standalone modal prototype superseded by inline attributes. |
| `RowImageUploadModal.jsx` | `admin/src/components/RowImageUploadModal.jsx` | **Superseded by `ImageManagerModal.jsx`**. |
| `RowQuantityTierModal.jsx` | `admin/src/components/RowQuantityTierModal.jsx` | **Superseded by `RoleQuantityTiersManager.jsx`**. |
| `SmartAttributeSuggestionPanel.jsx` | `admin/src/components/SmartAttributeSuggestionPanel.jsx` | **Incorporated into `attributeMasterData.js`** auto-suggestion dictionary. |
