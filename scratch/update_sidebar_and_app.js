const fs = require('fs');

// 1. Update AdminSidebar.jsx
let sidebarCode = fs.readFileSync('admin/src/components/common/AdminSidebar.jsx', 'utf8');

// Ensure Settings icon is imported
if (!sidebarCode.includes('Settings,') && !sidebarCode.includes('Settings }')) {
  sidebarCode = sidebarCode.replace(
    'SlidersHorizontal,',
    'SlidersHorizontal,\n  Settings,'
  );
}

// Add upi_verification under ORDERS & APPROVALS if not present
if (!sidebarCode.includes("id: 'upi_verification'")) {
  const targetUpi = `        {
          id: 'approval_center',`;
  const upiItem = `        {
          id: 'upi_verification',
          label: 'UPI Payment Verification',
          icon: ShieldCheck,
          badge: pendingUpiCount > 0 ? \`\${pendingUpiCount} Proof\` : null,
          badgeVariant: 'amber'
        },
        {
          id: 'approval_center',`;
  sidebarCode = sidebarCode.replace(targetUpi, upiItem);
}

// Add SETTINGS & CONFIGURATION section if not present
if (!sidebarCode.includes("title: 'SETTINGS & CONFIGURATION'")) {
  const settingsSection = `    {
      title: 'SETTINGS & CONFIGURATION',
      items: [
        {
          id: 'settings',
          label: 'General Settings',
          icon: Settings,
        },
        {
          id: 'branches',
          label: 'Branch Management',
          icon: Building2,
          badge: (branches || []).length > 0 ? (branches || []).length : null,
          badgeVariant: 'neutral'
        }
      ]
    },
    {
      title: 'SYSTEM & QUICK ACCESS',`;
  sidebarCode = sidebarCode.replace("    {\n      title: 'SYSTEM & QUICK ACCESS',", settingsSection);
}

fs.writeFileSync('admin/src/components/common/AdminSidebar.jsx', sidebarCode, 'utf8');
console.log('AdminSidebar.jsx updated successfully.');

// 2. Update App.jsx
let appCode = fs.readFileSync('admin/src/App.jsx', 'utf8');

// Add GeneralSettingsPage lazy import if not present
if (!appCode.includes('GeneralSettingsPage')) {
  appCode = appCode.replace(
    "const BranchManagementPage = React.lazy(() => import('./components/settings/BranchManagementPage'));",
    "const BranchManagementPage = React.lazy(() => import('./components/settings/BranchManagementPage'));\nconst GeneralSettingsPage = React.lazy(() => import('./components/settings/GeneralSettingsPage'));"
  );
}

// Add tab label
if (!appCode.includes("if (tab === 'settings') return 'General Settings';")) {
  appCode = appCode.replace(
    "if (tab === 'branches') return 'Branch Management';",
    "if (tab === 'settings') return 'General Settings';\n    if (tab === 'branches') return 'Branch Management';"
  );
}

// Add header title & subtitle
if (!appCode.includes("{activeTab === 'settings' && 'General Settings — Store Identity, Rates & Rules'}")) {
  appCode = appCode.replace(
    "{activeTab === 'branches' && 'Branch Management — Store Locations'}",
    "{activeTab === 'settings' && 'General Settings — Store Identity, Rates & Rules'}\n                  {activeTab === 'branches' && 'Branch Management — Store Locations'}"
  );
  appCode = appCode.replace(
    "{activeTab === 'home_banners' && 'Manage the carousel banners displayed on the customer mobile app home page. Changes sync in real-time.'}",
    "{activeTab === 'settings' && 'Configure store name, delivery fee thresholds, UPI payment options, and live announcements.'}\n                  {activeTab === 'home_banners' && 'Manage the carousel banners displayed on the customer mobile app home page. Changes sync in real-time.'}"
  );
}

// Pass branches & upiVerifications to AdminSidebar
if (!appCode.includes('branches={branches}')) {
  appCode = appCode.replace(
    'employees={employees}\n      />',
    'employees={employees}\n        branches={branches}\n        upiVerifications={upiVerifications}\n      />'
  );
}

// Render GeneralSettingsPage component
if (!appCode.includes('<GeneralSettingsPage')) {
  const targetRender = `{/* BRANCH MANAGEMENT MODULE (Admin Settings) */}`;
  const settingsRender = `{/* GENERAL SETTINGS MODULE (Admin Settings) */}
          {activeTab === 'settings' && (
            <React.Suspense fallback={<PageLoadingFallback />}>
              <GeneralSettingsPage />
            </React.Suspense>
          )}

          {/* BRANCH MANAGEMENT MODULE (Admin Settings) */}`;
  appCode = appCode.replace(targetRender, settingsRender);
}

fs.writeFileSync('admin/src/App.jsx', appCode, 'utf8');
console.log('App.jsx updated successfully.');

