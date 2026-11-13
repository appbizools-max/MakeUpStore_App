const fs = require('fs');

// 1. Update App.jsx to pass branches and upiVerifications to <AdminSidebar />
let appCode = fs.readFileSync('admin/src/App.jsx', 'utf8');
if (!appCode.includes('branches={branches}')) {
  appCode = appCode.replace(
    'employees={employees}\n      />',
    'employees={employees}\n        branches={branches}\n        upiVerifications={upiVerifications}\n      />'
  );
  appCode = appCode.replace(
    'employees={employees}\r\n      />',
    'employees={employees}\r\n        branches={branches}\r\n        upiVerifications={upiVerifications}\r\n      />'
  );
}
fs.writeFileSync('admin/src/App.jsx', appCode, 'utf8');
console.log('App.jsx updated with branches and upiVerifications props.');

// 2. Update AdminSidebar.jsx
let sidebarCode = fs.readFileSync('admin/src/components/common/AdminSidebar.jsx', 'utf8');

// Ensure Settings icon is imported
if (!sidebarCode.includes('Settings,') && !sidebarCode.includes('Settings }')) {
  sidebarCode = sidebarCode.replace('SlidersHorizontal,', 'SlidersHorizontal,\n  Settings,');
}

// Add explicit checks in isItemActive
if (!sidebarCode.includes("if (itemId === 'settings') return activeTab === 'settings';")) {
  sidebarCode = sidebarCode.replace(
    "if (itemId === 'quick_panel') return activeTab === 'quick_panel';",
    "if (itemId === 'quick_panel') return activeTab === 'quick_panel';\n    if (itemId === 'settings') return activeTab === 'settings';\n    if (itemId === 'branches') return activeTab === 'branches';\n    if (itemId === 'upi_verification') return activeTab === 'upi_verification';"
  );
}

// Update navSections in AdminSidebar.jsx
// Insert SETTINGS & CONFIGURATION right after OVERVIEW
const overviewEndPattern = `        {
          id: 'dashboard_visibility',
          label: 'Dashboard Visibility',
          icon: Eye
        }
      ]
    },`;

const settingsConfigSection = `        {
          id: 'dashboard_visibility',
          label: 'Dashboard Visibility',
          icon: Eye
        }
      ]
    },
    {
      title: 'SETTINGS & CONFIGURATION',
      items: [
        {
          id: 'settings',
          label: 'General Settings',
          icon: Settings,
          badge: null
        },
        {
          id: 'branches',
          label: 'Branch Management',
          icon: Building2,
          badge: (branches || []).length > 0 ? (branches || []).length : null,
          badgeVariant: 'neutral'
        }
      ]
    },`;

if (!sidebarCode.includes("title: 'SETTINGS & CONFIGURATION'")) {
  sidebarCode = sidebarCode.replace(overviewEndPattern, settingsConfigSection);
}

// Add upi_verification under ORDERS & APPROVALS if missing
if (!sidebarCode.includes("id: 'upi_verification'")) {
  const approvalTarget = `        {
          id: 'approval_center',
          label: 'Approval Center',`;

  const upiAndApproval = `        {
          id: 'upi_verification',
          label: 'UPI Payment Verification',
          icon: ShieldCheck,
          badge: pendingUpiCount > 0 ? \`\${pendingUpiCount} Proof\` : null,
          badgeVariant: 'amber'
        },
        {
          id: 'approval_center',
          label: 'Approval Center',`;

  sidebarCode = sidebarCode.replace(approvalTarget, upiAndApproval);
}

// Add persistent Store Settings quick button in Desktop Footer right above Log Out
const footerTargetDesktop = `<button
                type="button"
                onClick={onLogoutClick}
                className="w-full h-10 px-3 rounded-xl font-semibold text-xs text-rose-600 bg-rose-50/70`;

const footerReplacementDesktop = `<button
                type="button"
                onClick={() => navigateToTab('settings')}
                className={\`w-full h-9 px-3 rounded-xl font-bold text-xs flex items-center justify-between mb-2 transition-all cursor-pointer \${
                  activeTab === 'settings'
                    ? 'bg-pink-50 text-[#C2477A] border border-pink-200'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-[#C2477A]'
                }\`}
              >
                <div className="flex items-center gap-2">
                  <Settings size={15} />
                  <span>Store Settings</span>
                </div>
                <ChevronRight size={13} className="text-slate-400" />
              </button>

              <button
                type="button"
                onClick={onLogoutClick}
                className="w-full h-10 px-3 rounded-xl font-semibold text-xs text-rose-600 bg-rose-50/70`;

if (!sidebarCode.includes('<span>Store Settings</span>')) {
  sidebarCode = sidebarCode.replace(footerTargetDesktop, footerReplacementDesktop);
}

// Add collapsed mode Settings icon in footer
const footerCollapsedTarget = `<button
                type="button"
                onClick={onLogoutClick}
                onMouseEnter={(e) => handleTooltipEnter(e, 'Log Out', null)}
                onMouseLeave={handleTooltipLeave}
                className="w-10 h-10 rounded-xl text-rose-600`;

const footerCollapsedReplacement = `<button
                type="button"
                onClick={() => navigateToTab('settings')}
                onMouseEnter={(e) => handleTooltipEnter(e, 'General Settings', null)}
                onMouseLeave={handleTooltipLeave}
                className={\`w-10 h-10 rounded-xl flex items-center justify-center transition-all cursor-pointer mb-2 \${
                  activeTab === 'settings'
                    ? 'bg-pink-50 text-[#C2477A] border border-pink-200 font-bold'
                    : 'text-slate-500 hover:bg-[#FFF5F8] hover:text-[#C2477A]'
                }\`}
                title="Store Settings"
              >
                <Settings size={18} />
              </button>

              <button
                type="button"
                onClick={onLogoutClick}
                onMouseEnter={(e) => handleTooltipEnter(e, 'Log Out', null)}
                onMouseLeave={handleTooltipLeave}
                className="w-10 h-10 rounded-xl text-rose-600`;

if (!sidebarCode.includes('title="Store Settings"')) {
  sidebarCode = sidebarCode.replace(footerCollapsedTarget, footerCollapsedReplacement);
}

fs.writeFileSync('admin/src/components/common/AdminSidebar.jsx', sidebarCode, 'utf8');
console.log('AdminSidebar.jsx updated successfully with Settings & Configuration in primary navigation.');

