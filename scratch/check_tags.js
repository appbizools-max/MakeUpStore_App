const fs = require('fs');
const code = fs.readFileSync('admin/src/App.jsx', 'utf8');
const qpStart = code.indexOf("{activeTab === 'quick_panel'");
const qpEnd = code.indexOf("{/* 9. ABANDONED CARTS PAGE */}");
const qpCode = code.slice(qpStart, qpEnd);

const matches = [...qpCode.matchAll(/<([A-Z][a-zA-Z0-9]+)/g)].map(m => m[1]);
const uniqueTags = [...new Set(matches)];
console.log('JSX tags in quick_panel:', uniqueTags);

const importSection = code.slice(0, code.indexOf('// Lazy-loaded'));
for (const tag of uniqueTags) {
  const isImported = importSection.includes(tag);
  console.log(tag, 'imported:', isImported);
}

