import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import * as babelParser from '../../admin/node_modules/@babel/parser/lib/index.js';
import _traverse from '../../admin/node_modules/@babel/traverse/lib/index.js';

const traverse = _traverse.default || _traverse;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const filePath = path.resolve(__dirname, '../../admin/src/App.jsx');
const code = fs.readFileSync(filePath, 'utf8');

const knownGlobals = new Set([
  'window', 'document', 'navigator', 'console', 'setTimeout', 'clearTimeout',
  'setInterval', 'clearInterval', 'localStorage', 'sessionStorage', 'alert',
  'confirm', 'prompt', 'fetch', 'Math', 'Date', 'JSON', 'Object', 'Array',
  'String', 'Number', 'Boolean', 'RegExp', 'Set', 'Map', 'WeakSet', 'WeakMap',
  'Promise', 'Error', 'TypeError', 'RangeError', 'ReferenceError', 'SyntaxError',
  'parseInt', 'parseFloat', 'isNaN', 'isFinite', 'encodeURIComponent', 'decodeURIComponent',
  'Intl', 'URL', 'Blob', 'File', 'FileReader', 'FormData', 'btoa', 'atob',
  'Image', 'Audio', 'Event', 'CustomEvent', 'MutationObserver', 'ResizeObserver', 'IntersectionObserver',
  'requestAnimationFrame', 'cancelAnimationFrame', 'crypto', 'process'
]);

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

  console.log(`\n=== Results for App.jsx ===`);
  if (undeclared.size === 0) {
    console.log('✅ No undeclared identifiers found in App.jsx.');
  } else {
    console.log(`❌ Found ${undeclared.size} undeclared identifiers in App.jsx:`);
    for (const item of undeclared) {
      console.log(' - ' + item);
    }
  }
} catch (err) {
  console.error(`Error parsing App.jsx:`, err.message);
}
