const fs = require('fs');
const path = require('path');

const targetFiles = [
  'src/components/AbandonedCartsManager.jsx',
  'src/components/CategorySubcategoryManager.jsx',
  'src/components/employees/AllEmployeesPage.jsx',
  'src/components/employees/EmployeeActivityPage.jsx',
  'src/components/StockManagerPage.jsx',
  'src/components/AttributesMasterPage.jsx',
  'src/components/InlineShadeCard.jsx',
  'src/components/UniversalVariantBuilder.jsx',
  'src/components/ProductDiscoveryAndRichData.jsx',
  'src/components/ProductFormRightPanel.jsx',
  'src/components/ShadePricingModal.jsx',
  'src/components/RolePricingMatrix.jsx',
  'src/components/RestockModal.jsx',
];

targetFiles.forEach((relPath) => {
  const filePath = path.resolve(relPath);
  if (!fs.existsSync(filePath)) return;

  let code = fs.readFileSync(filePath, 'utf8');

  // Replace old magenta #CE4270 with logo primary brand color #C2477A
  code = code.replace(/#CE4270/gi, '#C2477A');
  code = code.replace(/#FDF2F4/gi, '#FFF5F8');

  // Replace violet and purple backgrounds
  code = code.replace(/bg-violet-50(\/[0-9]+)?/g, 'bg-[#FFF5F8]$1');
  code = code.replace(/bg-violet-100/g, 'bg-[#FDF2F8]');
  code = code.replace(/bg-violet-600/g, 'bg-[#C2477A]');
  code = code.replace(/bg-violet-700/g, 'bg-[#9E2D5B]');

  code = code.replace(/bg-purple-50(\/[0-9]+)?/g, 'bg-[#FFF5F8]$1');
  code = code.replace(/bg-purple-100/g, 'bg-[#FDF2F8]');
  code = code.replace(/bg-purple-600/g, 'bg-[#C2477A]');
  code = code.replace(/bg-purple-700/g, 'bg-[#9E2D5B]');

  code = code.replace(/bg-indigo-50(\/[0-9]+)?/g, 'bg-[#FFF5F8]$1');
  code = code.replace(/bg-indigo-100/g, 'bg-[#FDF2F8]');
  code = code.replace(/bg-indigo-500/g, 'bg-[#C2477A]');
  code = code.replace(/bg-indigo-600/g, 'bg-[#C2477A]');
  code = code.replace(/bg-indigo-700/g, 'bg-[#9E2D5B]');

  // Replace gradients
  code = code.replace(/bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700/g, 'bg-[#C2477A] hover:bg-[#9E2D5B]');
  code = code.replace(/from-indigo-600 to-purple-600/g, 'bg-[#C2477A]');

  // Replace text colors
  code = code.replace(/text-violet-600/g, 'text-[#C2477A]');
  code = code.replace(/text-violet-700/g, 'text-black');
  code = code.replace(/text-violet-800/g, 'text-black');
  code = code.replace(/text-violet-900/g, 'text-black');
  code = code.replace(/text-violet-400/g, 'text-[#C2477A]');
  code = code.replace(/text-violet-500/g, 'text-[#C2477A]');

  code = code.replace(/text-purple-600/g, 'text-[#C2477A]');
  code = code.replace(/text-purple-700/g, 'text-black');
  code = code.replace(/text-purple-800/g, 'text-black');
  code = code.replace(/text-purple-900/g, 'text-black');
  code = code.replace(/text-purple-400/g, 'text-[#C2477A]');
  code = code.replace(/text-purple-500/g, 'text-[#C2477A]');

  code = code.replace(/text-indigo-600/g, 'text-[#C2477A]');
  code = code.replace(/text-indigo-700/g, 'text-black');
  code = code.replace(/text-indigo-800/g, 'text-black');
  code = code.replace(/text-indigo-400/g, 'text-[#C2477A]');

  // Replace borders and rings
  code = code.replace(/border-violet-100(\/[0-9]+)?/g, 'border-[#FCE4EC]$1');
  code = code.replace(/border-violet-200(\/[0-9]+)?/g, 'border-[#FCE4EC]$1');
  code = code.replace(/border-violet-300/g, 'border-[#F8B4CB]');
  code = code.replace(/border-violet-400/g, 'border-[#C2477A]');
  code = code.replace(/border-violet-500/g, 'border-[#C2477A]');
  code = code.replace(/border-violet-600/g, 'border-[#C2477A]');

  code = code.replace(/border-purple-100(\/[0-9]+)?/g, 'border-[#FCE4EC]$1');
  code = code.replace(/border-purple-200(\/[0-9]+)?/g, 'border-[#FCE4EC]$1');
  code = code.replace(/border-purple-300/g, 'border-[#F8B4CB]');
  code = code.replace(/border-purple-400/g, 'border-[#C2477A]');
  code = code.replace(/border-purple-500/g, 'border-[#C2477A]');
  code = code.replace(/border-purple-600/g, 'border-[#C2477A]');

  code = code.replace(/border-indigo-100(\/[0-9]+)?/g, 'border-[#FCE4EC]$1');
  code = code.replace(/border-indigo-200(\/[0-9]+)?/g, 'border-[#FCE4EC]$1');
  code = code.replace(/border-indigo-600/g, 'border-[#C2477A]');

  code = code.replace(/ring-violet-200/g, 'ring-[#C2477A]/20');
  code = code.replace(/ring-purple-200/g, 'ring-[#C2477A]/20');
  code = code.replace(/ring-purple-500/g, 'ring-[#C2477A]');

  // Replace hover states
  code = code.replace(/hover:text-indigo-600/g, 'hover:text-[#C2477A]');
  code = code.replace(/hover:text-violet-600/g, 'hover:text-[#C2477A]');
  code = code.replace(/hover:text-purple-600/g, 'hover:text-[#C2477A]');
  code = code.replace(/hover:bg-indigo-50/g, 'hover:bg-[#FFF5F8]');
  code = code.replace(/hover:bg-violet-50/g, 'hover:bg-[#FFF5F8]');
  code = code.replace(/hover:bg-purple-50/g, 'hover:bg-[#FFF5F8]');
  code = code.replace(/hover:bg-violet-100/g, 'hover:bg-[#FDF2F8]');
  code = code.replace(/hover:border-indigo-600/g, 'hover:border-[#C2477A]');

  fs.writeFileSync(filePath, code, 'utf8');
  console.log('Harmonized:', relPath);
});
