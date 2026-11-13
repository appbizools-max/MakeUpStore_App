const fs = require('fs');
let code = fs.readFileSync('admin/src/components/common/AdminSidebar.jsx', 'utf8');
const lines = code.split(/\r?\n/);

const storeMgmtIdx = lines.findIndex(l => l.includes("title: 'STORE MANAGEMENT'"));
console.log('storeMgmtIdx:', storeMgmtIdx);

if (storeMgmtIdx !== -1 && !code.includes("title: 'SETTINGS & CONFIGURATION'")) {
  const settingsBlock = [
    '    {',
    "      title: 'SETTINGS & CONFIGURATION',",
    '      items: [',
    '        {',
    "          id: 'settings',",
    "          label: 'General Settings',",
    '          icon: Settings,',
    '          badge: null',
    '        },',
    '        {',
    "          id: 'branches',",
    "          label: 'Branch Management',",
    '          icon: Building2,',
    '          badge: (branches || []).length > 0 ? (branches || []).length : null,',
    "          badgeVariant: 'neutral'",
    '        }',
    '      ]',
    '    },'
  ];

  // Insert before the opening brace of STORE MANAGEMENT (storeMgmtIdx - 1)
  lines.splice(storeMgmtIdx - 1, 0, ...settingsBlock);
  fs.writeFileSync('admin/src/components/common/AdminSidebar.jsx', lines.join('\n'), 'utf8');
  console.log('Successfully inserted SETTINGS & CONFIGURATION before STORE MANAGEMENT!');
}

// Also check mobile drawer and desktop footer
let updatedCode = fs.readFileSync('admin/src/components/common/AdminSidebar.jsx', 'utf8');

// Ensure upi_verification is also under ORDERS & APPROVALS
if (!updatedCode.includes("id: 'upi_verification'")) {
  const approvalTarget = "          id: 'approval_center',";
  const upiBlock = `          id: 'upi_verification',
          label: 'UPI Payment Verification',
          icon: ShieldCheck,
          badge: pendingUpiCount > 0 ? \`\${pendingUpiCount} Proof\` : null,
          badgeVariant: 'amber'
        },
        {
          id: 'approval_center',`;
  updatedCode = updatedCode.replace(approvalTarget, upiBlock);
  fs.writeFileSync('admin/src/components/common/AdminSidebar.jsx', updatedCode, 'utf8');
  console.log('Successfully added upi_verification under ORDERS & APPROVALS!');
}

