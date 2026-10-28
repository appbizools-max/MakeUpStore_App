// ==============================================================================
// SALBEAU ADMIN PANEL — CENTRAL COMPONENT BARREL EXPORT
// Provides clean, resilient module imports across the entire admin application
// ==============================================================================

// Products Module
export { default as AddNewProductPage } from './products/AddNewProductPage_Redesigned';
export { default as ProductsCatalogMatrix } from './products/ProductsCatalogMatrix';
export { default as DynamicVariantBuilder } from './products/DynamicVariantBuilder';
export { default as ProductFormRightPanel } from './products/ProductFormRightPanel';
export { default as BarcodeScannerModal } from './products/BarcodeScannerModal';
export { default as BarcodeSearchResultModal } from './products/BarcodeSearchResultModal';
export { BarcodeLookupReviewModal } from './products/BarcodeLookupReviewModal';
export { BulkProductEntryModal } from './products/BulkProductEntryModal';
export { ExcelImportModal } from './products/ExcelImportModal';
export { ColumnManagerModal } from './products/ColumnManagerModal';
export { default as ShadePricingModal } from './products/ShadePricingModal';
export { default as RolePricingMatrix } from './products/RolePricingMatrix';
export { default as RoleQuantityTiersManager } from './products/RoleQuantityTiersManager';
export { default as GeneratedDataPanel } from './products/GeneratedDataPanel';

// Categories Module
export { default as MainCategoriesManager, generateSlug } from './categories/MainCategoriesManager';
export { default as AttributesMasterPage } from './categories/AttributesMasterPage';

// Brands Module
export { default as BrandManagementPage } from './brands/BrandManagementPage';
export { default as BrandFormModal } from './brands/BrandFormModal';
export { default as BrandImportModal } from './brands/BrandImportModal';
export { default as BrandLogoSearchModal } from './brands/BrandLogoSearchModal';

// Media & Asset Module
export { default as ImageManagerModal } from './media/ImageManagerModal';
export { default as ImageDropzoneUploader } from './media/ImageDropzoneUploader';
export { default as ImageField } from './media/ImageField';
export { default as InlineImageSection } from './media/InlineImageSection';

// Orders & Fulfillment Module
export { default as FulfillmentStatusSelector } from './orders/FulfillmentStatusSelector';
export { AbandonedCartsManager } from './orders/AbandonedCartsManager';

// B2B & Customer Intent Module
export { default as B2BVerificationPage } from './b2b/B2BVerificationPage';
export { default as CustomerSearchRequestsPage } from './b2b/CustomerSearchRequestsPage';

// Governance & Employees Module
export { default as ApprovalCenterPage } from './governance/ApprovalCenterPage';
export { default as AuditTrailPage } from './governance/AuditTrailPage';
export { default as AllEmployeesPage } from './governance/employees/AllEmployeesPage';
export { default as AddEmployeePage } from './governance/employees/AddEmployeePage';
export { default as EmployeeProfilePage } from './governance/employees/EmployeeProfilePage';
export { default as EditEmployeePage } from './governance/employees/EditEmployeePage';
export { default as EmployeePermissionsPage } from './governance/employees/EmployeePermissionsPage';
export { default as EmployeeActivityPage } from './governance/employees/EmployeeActivityPage';

// Common Reusable Controls
export {
  default as HexColorPicker,
  getBeautyShadeName,
  MAKEUP_SWATCH_PRESETS,
  normalizeHex,
  isValidHex
} from './common/HexColorPicker';
export { default as SearchableSelect } from './common/SearchableSelect';
