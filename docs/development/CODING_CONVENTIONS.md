# SALBEAU MAKEUPSTORE — CODING CONVENTIONS & ENGINEERING STANDARDS

## 1. Overview & Architectural Philosophy

The Salbeau MakeUpStore platform is an enterprise-grade multi-tier e-commerce solution comprising:
- **Admin Management Console:** React 18, Vite 5, Tailwind CSS, Lucide icons, Supabase client.
- **Customer Mobile Application:** React Native / Expo SDK 51, NativeWind, AsyncStorage / LocalStorage dual runtime.
- **Backend Infrastructure:** Supabase PostgreSQL with Row Level Security (RLS), custom SQL functions, and Storage buckets.

The codebase is organized by **domain-driven feature boundaries** rather than flat technical layers. Every file must have a single, well-defined responsibility, clear naming, and an intuitive directory location.

---

## 2. Directory & Domain Structure

### 2.1 Admin Panel (`admin/src/`)
```
admin/src/
├── assets/          # Static logos, icons, global brand SVGs
├── components/      # Domain-partitioned UI modules & controls
│   ├── index.js     # Central barrel re-exporting all active components
│   ├── b2b/         # B2B verification, partner requests, tiered approval
│   ├── categories/  # Hierarchy management, attribute master matrices
│   ├── common/      # Generic atomic controls (HexColorPicker, SearchableSelect)
│   ├── governance/  # RBAC, audit trails, approval centers, employee lifecycle
│   │   └── employees/
│   ├── media/       # Image optimization, multi-source dropzone, Google image search
│   ├── orders/      # Fulfillment workflows, status selectors, cart recovery
│   └── products/    # Catalog matrix, variant builder, barcodes, pricing, bulk import
│       └── preview/ # Real-time merchandising preview cards
├── config/          # Supabase client singletons & environment wrappers
├── context/         # React Context providers (AdminContext.jsx)
└── utils/           # Pure algorithms, Excel generators, barcode lookup, image optimization
```

### 2.2 Customer Application (`app/src/`)
```
app/src/
├── api/             # Supabase data access layer & queries
├── components/      # Reusable visual components (Navbar, Footer, ProductCards)
├── context/         # AppContext.jsx (Web) & AppContext.js (Native/AsyncStorage)
├── features/        # Cross-platform screens & business features
├── screens/         # Mobile/Web page views (Home, Catalog, B2BRegistration, Cart)
├── theme/           # Salbeau visual design tokens (colors, typography, spacing)
└── utils/           # B2B verification services, currency formatters, validation
```

### 2.3 Database & Migrations (`database/`)
```
database/
├── README.md        # Migration execution instructions and RLS policy documentation
└── migrations/      # Chronologically sequenced migration files
    ├── 001_supabase_schema.sql
    ├── 002_b2b_verification_migration.sql
    ├── 003_custom_modules_migration.sql
    ├── 004_inventory_removal_migration.sql
    └── 005_remove_all_images_migration.sql
```

---

## 3. File Naming Conventions

Always adhere to standard naming schemes based on file role:

| File Type | Convention | Example |
|---|---|---|
| **React Components / Modals** | PascalCase (`.jsx`) | `AddNewProductPage_Redesigned.jsx`, `ImageManagerModal.jsx` |
| **Preview Cards / Subcomponents**| PascalCase (`.jsx`) | `ProductPreviewCard.jsx`, `PricingPreviewCard.jsx` |
| **Pure Utilities / Helpers** | camelCase (`.js` / `.mjs`) | `barcodeUtils.js`, `imageOptimizer.js` |
| **React Contexts** | PascalCase (`.jsx` / `.js`) | `AdminContext.jsx`, `AppContext.js` |
| **Configuration Files** | camelCase or standard (`.js`) | `supabase.js`, `vite.config.js` |
| **Database Migrations** | `NNN_snake_case.sql` | `001_supabase_schema.sql`, `004_inventory_removal.sql` |
| **Maintenance Scripts** | `snake_case.mjs` / `.js` | `inspect_images.mjs`, `clean_fallbacks.mjs` |
| **Documentation** | `UPPER_SNAKE_CASE.md` | `CODING_CONVENTIONS.md`, `PROJECT_SETUP.md` |

### Disallowed Names:
Never use vague, ambiguous, or numbered temporary names:
❌ `temp.jsx`, `test123.js`, `final2.jsx`, `common2.js`, `NewComponent.jsx`.

---

## 4. Import & Path Alias Standards

The Admin Panel supports first-class Vite path aliases configured in `admin/vite.config.js`. Developers should use clean aliases or relative paths within the same domain folder:

```javascript
// Preferred Path Aliases
import { useAdmin } from '@context/AdminContext';
import { supabase } from '@config/supabase';
import { optimizeImage } from '@utils/imageOptimizer';
import { HexColorPicker } from '@components/common/HexColorPicker';

// Or Central Barrel Export
import {
  AddNewProductPage,
  ProductsCatalogMatrix,
  ImageManagerModal,
  B2BVerificationPage
} from '../components';
```

When importing siblings within the same domain folder, standard relative paths are encouraged:
```javascript
import RolePricingMatrix from './RolePricingMatrix';
import DynamicVariantBuilder from './DynamicVariantBuilder';
```

---

## 5. Domain-Specific Business Rules

### 5.1 Strict Inventory Removal Policy (Zero Stock Tracking)
Salbeau MakeUpStore explicitly **does NOT track stock quantities, warehouse locations, reorder points, low-stock thresholds, or automatic stock deduction**.
- **Rule:** Never introduce `stock_quantity`, `quantity_available`, `reorder_level`, `low_stock_alert`, or `inventory_ledger` into database schemas or UI forms.
- **Availability Logic:** Products and variants use active binary status flags (`status = 'active' | 'inactive'`) and in-stock toggles (`is_in_stock = true | false`).

### 5.2 Four-Tier Role-Based Pricing
Every product and variant supports 4 distinct pricing tiers:
1. **Retail Price (`retail_price`):** Default consumer price.
2. **Wholesale / Silver (`wholesale_price`):** Standard trade and salon discount.
3. **Distributor / Gold (`distributor_price`):** High-volume bulk trade price.
4. **VIP / Diamond (`vip_price`):** Exclusive strategic partner tier.

All pricing operations must compute markups and discounts against these four explicit fields.

### 5.3 Parent-Child Catalog Hierarchy
- **Parent Product (`products`):** Contains brand, category, subcategory, generic description, ingredients, benefits, and shared merchandising flags.
- **Child Variant (`product_variants`):** Contains variant-specific attributes (shade name, hex color code, size, finish), unique barcode / SKU, and tier pricing.

### 5.4 Media Management & Optimization
All images uploaded to Supabase Storage (`product-images` bucket) must be optimized prior to upload:
- Automatic conversion to WebP format where supported.
- Resizing bounds (max width 1200px, max height 1200px) with quality compression (0.82).
- Preservation of URL-based external assets and clipboard paste imports.

### 5.5 B2B Verification Lifecycle
Customer B2B accounts follow a strict state machine:
`pending` ➔ `under_review` ➔ `approved` (or `rejected` / `suspended`).
Approvals assign a verified business role (`wholesale`, `distributor`, `vip`) which unlocks respective catalog pricing.

---

## 6. Code Style & Quality Guidelines

1. **React Functional Components & Hooks:** Class components are forbidden. Use React standard hooks (`useState`, `useEffect`, `useMemo`, `useCallback`, `useRef`).
2. **Immutability:** Never mutate state directly. Always use functional updates or spread copies.
3. **Graceful Failures & Fallbacks:** Always handle network errors and Supabase exceptions gracefully. Show user-friendly toast messages and error badges.
4. **No Console Garbage in Production:** Development logs should use informative prefixes (e.g. `[Salbeau Admin]`) and avoid dumping raw tokens or sensitive customer records.
5. **Accessibility & Interactive Elements:** Ensure all buttons have descriptive aria-labels or title attributes, keyboard navigation support (Enter / Escape on modals), and distinct hover/focus rings.
