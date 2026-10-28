import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import * as babelParser from '../../admin/node_modules/@babel/parser/lib/index.js';
import _traverse from '../../admin/node_modules/@babel/traverse/lib/index.js';

const traverse = _traverse.default || _traverse;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const srcDir = path.resolve(__dirname, '../../admin/src');

function getAllJsxFiles(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat && stat.isDirectory()) {
      results = results.concat(getAllJsxFiles(fullPath));
    } else if (file.endsWith('.jsx') || file.endsWith('.js')) {
      results.push(fullPath);
    }
  });
  return results;
}

const files = getAllJsxFiles(srcDir);

const knownGlobals = new Set([
  'window', 'document', 'navigator', 'console', 'setTimeout', 'clearTimeout',
  'setInterval', 'clearInterval', 'localStorage', 'sessionStorage', 'alert',
  'confirm', 'prompt', 'fetch', 'Math', 'Date', 'JSON', 'Object', 'Array',
  'String', 'Number', 'Boolean', 'RegExp', 'Set', 'Map', 'WeakSet', 'WeakMap',
  'Promise', 'Error', 'TypeError', 'RangeError', 'ReferenceError', 'SyntaxError',
  'parseInt', 'parseFloat', 'isNaN', 'isFinite', 'encodeURIComponent', 'decodeURIComponent',
  'Intl', 'URL', 'Blob', 'File', 'FileReader', 'FormData', 'btoa', 'atob',
  'Image', 'Audio', 'Event', 'CustomEvent', 'MutationObserver', 'ResizeObserver', 'IntersectionObserver',
  'requestAnimationFrame', 'cancelAnimationFrame', 'crypto', 'process', 'globalThis',
  'HTMLInputElement', 'HTMLButtonElement', 'HTMLElement', 'Node', 'Element'
]);

let issuesFound = 0;

for (const filePath of files) {
  const relPath = path.relative(srcDir, filePath);
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

    if (undeclared.size > 0) {
      issuesFound++;
      console.log(`\n❌ ${relPath}:`);
      for (const item of undeclared) {
        console.log('   - ' + item);
      }
    }
  } catch (err) {
    console.error(`Error parsing ${relPath}:`, err.message);
  }
}

if (issuesFound === 0) {
  console.log('\n🎉 ALL admin/src files passed AST reference checks cleanly! 0 undeclared identifiers.');
} else {
  console.log(`\n⚠️ Total files with issues: ${issuesFound}`);
}
