import fs from 'fs';
import path from 'path';

// Read ProductsCatalogMatrix.jsx
const code = fs.readFileSync('admin/src/components/products/ProductsCatalogMatrix.jsx', 'utf8');

// Simple regex to check all identifiers in function calls or setters
const lines = code.split('\n');
console.log(`Checking ${lines.length} lines in ProductsCatalogMatrix.jsx...`);

// Look for undefined handlers or functions
const suspicious = [];
lines.forEach((line, index) => {
  if (line.includes('setQuickShadePriceModalProduct')) {
    suspicious.push({ line: index + 1, content: line.trim() });
  }
});

console.log("Suspicious matches:", suspicious);
