import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import * as babelParser from '../../admin/node_modules/@babel/parser/lib/index.js';
import _traverse from '../../admin/node_modules/@babel/traverse/lib/index.js';

const traverse = _traverse.default || _traverse;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const filesToCheck = [
  'admin/src/components/products/ProductsCatalogMatrix.jsx',
  'admin/src/components/products/AddNewProductPage_Redesigned.jsx',
  'admin/src/components/products/BulkProductEntryModal.jsx',
  'admin/src/components/products/BarcodeSearchResultModal.jsx',
  'admin/src/components/products/ExcelImportModal.jsx',
  'admin/src/components/products/GeneratedDataPanel.jsx',
  'admin/src/components/products/RoleQuantityTiersManager.jsx'
];

const knownGlobals = new Set([
  'window', 'document', 'navigator', 'console', 'setTimeout', 'clearTimeout',
  'setInterval', 'clearInterval', 'localStorage', 'sessionStorage', 'alert',
  'confirm', 'prompt', 'fetch', 'Math', 'Date', 'JSON', 'Object', 'Array',
  'String', 'Number', 'Boolean', 'RegExp', 'Set', 'Map', 'WeakSet', 'WeakMap',
  'Promise', 'Error', 'TypeError', 'RangeError', 'ReferenceError', 'SyntaxError',
  'parseInt', 'parseFloat', 'isNaN', 'isFinite', 'encodeURIComponent', 'decodeURIComponent',
  'Intl', 'URL', 'Blob', 'File', 'FileReader', 'FormData', 'btoa', 'atob',
  'Image', 'Audio', 'Event', 'CustomEvent', 'MutationObserver', 'ResizeObserver', 'IntersectionObserver',
  'requestAnimationFrame', 'cancelAnimationFrame', 'crypto'
]);

for (const relPath of filesToCheck) {
  const filePath = path.resolve(__dirname, '../../', relPath);
  if (!fs.existsSync(filePath)) {
    console.log(`Skipping missing: ${relPath}`);
    continue;
  }
  const code = fs.readFileSync(filePath, 'utf8');
  try {
    const ast = babelParser.parse(code, {
      sourceType: 'module',
      plugins: ['jsx']
    });

    const undeclared = new Set();

    traverse(ast, {
      ReferencedIdentifier(p) {
        const name = p.node.name;
        if (knownGlobals.has(name)) return;
        if (!p.scope.hasBinding(name)) {
          undeclared.add(`${name} (line ${p.node.loc.start.line})`);
        }
      }
    });

    console.log(`\n=== Results for ${relPath} ===`);
    if (undeclared.size === 0) {
      console.log('✅ No undeclared identifiers found.');
    } else {
      console.log(`❌ Found ${undeclared.size} undeclared identifiers:`);
      for (const item of undeclared) {
        console.log(' - ' + item);
      }
    }
  } catch (err) {
    console.error(`Error parsing ${relPath}:`, err.message);
  }
}
