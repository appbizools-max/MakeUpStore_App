# SALBEAU MAKEUPSTORE — TESTING & VERIFICATION GUIDE

## 1. Overview & Quality Assurance Philosophy

The Salbeau MakeUpStore platform handles multi-role wholesale commerce, sensitive B2B trade pricing, barcode scanning, and hierarchical product catalog management. A rigorous testing approach ensures that features remain resilient across releases.

---

## 2. Production Build Verification

The primary automated sanity check for the Admin Console is the Vite production build. It rigorously compiles all JSX, validates all module imports, checks tree shaking, and generates production bundles:

```bash
cd admin
npm run build
```

### Acceptance Criteria:
- **Exit Code:** `0` (Success).
- **Module Transformation:** All ~1,600+ modules transform without unresolved import errors.
- **Output:** `dist/index.html`, `dist/assets/*.css`, `dist/assets/*.js`.

---

## 3. Manual QA Verification Matrix

### 3.1 Catalog & Multi-Variant Product Builder
| ID | Test Scenario | Steps | Expected Result |
|---|---|---|---|
| **PRD-01** | Create Parent Product | Navigate to `Add Product`, fill title, brand, category, and save. | Parent record is created with active status in database. |
| **PRD-02** | Add Child Shade Variants | Open Variant Builder, add shade name, select hex swatch from `HexColorPicker`. | Variant swatch renders accurately with automatic beauty shade classification. |
| **PRD-03** | Four Role-Based Prices | Enter Retail ($50), Silver ($40), Gold ($35), Diamond ($30). | All four price tiers persist independently without overriding one another. |
| **PRD-04** | Role Quantity Tiers | Add tier (e.g. 10+ units get 5% discount, 50+ get 10%). | Tiers are attached to variant JSON payload and saved to Supabase. |
| **PRD-05** | Inventory Rule Check | Inspect UI forms and database records. | **ZERO stock quantity fields, zero warehouse logic, zero low-stock badges.** |

### 3.2 Barcode & Hardware Scanner
| ID | Test Scenario | Steps | Expected Result |
|---|---|---|---|
| **BAR-01** | USB HID Keystroke Scanner | Focus on input and scan physical barcode via hardware scanner. | Fast keystrokes (<50ms buffer) are recognized, buffered, and trigger sound beep. |
| **BAR-02** | Camera Scanner Modal | Open Barcode Scanner modal, grant camera permission. | Video feed streams, detects EAN-13/UPC barcode, and populates form. |
| **BAR-03** | Barcode Lookup Service | Enter valid barcode (e.g., L'Oréal or Maybelline EAN). | Service queries product database/OpenFoodFacts/Beauty APIs to auto-populate metadata. |

### 3.3 Bulk Excel Import & Export
| ID | Test Scenario | Steps | Expected Result |
|---|---|---|---|
| **EXC-01** | Download Template | In Products Matrix, click `Import Excel` ➔ `Download Template`. | Excel (`.xlsx`) downloads with proper column headers and validation notes. |
| **EXC-02** | Upload & Column Mapping | Upload populated Excel sheet. | ColumnManagerModal automatically maps columns (Title, Barcode, Retail Price, etc.). |
| **EXC-03** | Validation & Batch Commit | Review preview matrix and click `Import Valid Products`. | Valid products are committed to Supabase in chunks with clear error reporting for invalid rows. |

### 3.4 Media & Image Management
| ID | Test Scenario | Steps | Expected Result |
|---|---|---|---|
| **MED-01** | Multi-Source Upload | Open `ImageManagerModal` from Category or Product page. | Supports Local Upload, URL import, Clipboard Paste (Ctrl+V), and Google Images search. |
| **MED-02** | WebP Optimization | Upload a large 5MB JPEG image. | Image is automatically scaled (max 1200x1200) and compressed to WebP (<200KB). |
| **MED-03** | Modal Controls & Close | Open modal, scroll through images, click top-right `✕` button. | Modal closes cleanly without throwing errors or altering unsaved data. |

### 3.5 B2B Verification Lifecycle
| ID | Test Scenario | Steps | Expected Result |
|---|---|---|---|
| **B2B-01** | View Pending Requests | Navigate to `B2B Verification` tab. | Lists pending trade applications with customer name, trade license, and submitted documents. |
| **B2B-02** | Approve Application | Select applicant, assign role (`Wholesale / Silver`), click `Approve`. | Customer profile status transitions to `approved`, audit log is recorded, role pricing unlocks. |
| **B2B-03** | Reject with Reason | Click `Reject`, enter rejection notes (e.g., "Expired Tax ID"). | Status transitions to `rejected`, customer notified, rejection reason saved. |

### 3.6 Governance & Employee RBAC
| ID | Test Scenario | Steps | Expected Result |
|---|---|---|---|
| **GOV-01** | View Employee Directory | Navigate to `Governance` ➔ `All Employees`. | Lists active employees with department tags, roles, and status indicators. |
| **GOV-02** | Permission Matrix Edit | Edit employee permissions, toggle specific modules (e.g. disable `pricing_edit`). | Permissions object updates in `employees` table and enforces UI button disabling. |
| **GOV-03** | Audit Trail Log | Perform an administrative action (e.g., edit category). | Action is appended to `employee_activity_logs` with timestamp, user ID, and target entity. |

---

## 4. Database & Script Diagnostics

To verify backend connectivity and schema health:
```bash
# Verify Supabase database tables and RLS
node scripts/database/test_db.mjs

# Verify images storage references
node scripts/database/inspect_images.mjs

# Audit custom tables and columns
node scripts/database/verify_supabase_audit.js
```

---

## 5. Mobile App Smoke Testing

1. Run `npm start` in `app/`.
2. Press `w` to verify web preview:
   - Verify Home screen banners and category rail render.
   - Verify Catalog filtering by category, brand, and shade swatch.
   - Verify Cart and Checkout flows without inventory stock blockers.
