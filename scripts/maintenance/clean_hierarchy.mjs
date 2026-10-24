import fs from 'fs';
import path from 'path';

// Clean categoriesHierarchy.js
const hierPath = 'e:/MakeUpStore_App-main/MakeUpStore_App/app/src/config/categoriesHierarchy.js';
if (fs.existsSync(hierPath)) {
  let content = fs.readFileSync(hierPath, 'utf8');
  // replace CATEGORY_IMAGES URLs with ''
  content = content.replace(/:\s*['"]https:\/\/images\.unsplash\.com\/[^'"]+['"]/g, ": ''");
  fs.writeFileSync(hierPath, content, 'utf8');
  console.log('Cleaned categoriesHierarchy.js');
}

// Clean AppContext.jsx & AppContext.js
for (const ctxPath of [
  'e:/MakeUpStore_App-main/MakeUpStore_App/app/src/context/AppContext.jsx',
  'e:/MakeUpStore_App-main/MakeUpStore_App/app/src/context/AppContext.js'
]) {
  if (fs.existsSync(ctxPath)) {
    let content = fs.readFileSync(ctxPath, 'utf8');
    content = content.replace(/['"]https:\/\/images\.unsplash\.com\/[^'"]+['"]/g, "''");
    fs.writeFileSync(ctxPath, content, 'utf8');
    console.log(`Cleaned ${path.basename(ctxPath)}`);
  }
}

console.log('Finished full cleanup');
