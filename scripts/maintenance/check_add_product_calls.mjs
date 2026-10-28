import fs from 'fs';
import { parse } from '../../admin/node_modules/@babel/parser/lib/index.js';

const code = fs.readFileSync('admin/src/components/products/AddNewProductPage_Redesigned.jsx', 'utf8');

const ast = parse(code, {
  sourceType: 'module',
  plugins: ['jsx']
});

const declared = new Set([
  'window', 'document', 'console', 'setTimeout', 'clearTimeout', 'setInterval', 'clearInterval',
  'localStorage', 'sessionStorage', 'alert', 'confirm', 'prompt', 'navigator', 'fetch',
  'Math', 'Date', 'Number', 'String', 'Boolean', 'Array', 'Object', 'Set', 'Map', 'JSON',
  'RegExp', 'Error', 'Promise', 'Intl', 'isNaN', 'isFinite', 'parseInt', 'parseFloat',
  'encodeURIComponent', 'decodeURIComponent', 'React'
]);

function walk(node, scope = new Set(declared)) {
  if (!node) return;
  const currentScope = new Set(scope);

  if (node.type === 'ImportSpecifier' || node.type === 'ImportDefaultSpecifier' || node.type === 'ImportNamespaceSpecifier') {
    declared.add(node.local.name);
    return;
  }
  if (node.type === 'VariableDeclarator') {
    if (node.id.type === 'Identifier') currentScope.add(node.id.name);
    else if (node.id.type === 'ObjectPattern') {
      node.id.properties.forEach(p => {
        if (p.value?.type === 'Identifier') currentScope.add(p.value.name);
        else if (p.key?.type === 'Identifier') currentScope.add(p.key.name);
      });
    } else if (node.id.type === 'ArrayPattern') {
      node.id.elements.forEach(el => {
        if (el?.type === 'Identifier') currentScope.add(el.name);
      });
    }
  }
  if (node.type === 'FunctionDeclaration' || node.type === 'FunctionExpression' || node.type === 'ArrowFunctionExpression') {
    if (node.id?.name) currentScope.add(node.id.name);
    node.params.forEach(p => {
      if (p.type === 'Identifier') currentScope.add(p.name);
      else if (p.type === 'AssignmentPattern' && p.left.type === 'Identifier') currentScope.add(p.left.name);
      else if (p.type === 'ObjectPattern') {
        p.properties.forEach(prop => {
          if (prop.value?.type === 'Identifier') currentScope.add(prop.value.name);
          else if (prop.key?.type === 'Identifier') currentScope.add(prop.key.name);
          else if (prop.argument?.type === 'Identifier') currentScope.add(prop.argument.name);
        });
      }
    });
  }

  if (node.type === 'CallExpression' && node.callee.type === 'Identifier') {
    const name = node.callee.name;
    if (!currentScope.has(name) && !declared.has(name)) {
      console.log(`[UNDEFINED CALL in AddNewProductPage] Line ${node.loc?.start?.line}: ${name}()`);
    }
  }

  for (const key of Object.keys(node)) {
    if (key === 'loc' || key === 'comments') continue;
    const val = node[key];
    if (Array.isArray(val)) {
      val.forEach(child => walk(child, currentScope));
    } else if (typeof val === 'object' && val !== null && val.type) {
      walk(val, currentScope);
    }
  }
}

walk(ast);
