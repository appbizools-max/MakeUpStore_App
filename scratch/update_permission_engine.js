import fs from 'fs';

const path = 'admin/src/utils/permissionEngine.js';
let content = fs.readFileSync(path, 'utf8');

const target = "case 'settings':";
const replacement = "case 'settings':\r\n    case 'security_2fa':\r\n    case 'security':";

if (content.includes(target)) {
  content = content.replace(target, replacement);
  fs.writeFileSync(path, content, 'utf8');
  console.log('Successfully updated permissionEngine.js');
} else {
  console.log('Target not found');
}

