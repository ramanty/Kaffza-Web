const fs = require('fs');
const path = require('path');

const dir = '/home/ubuntu/Kaffza-Web/apps/web/src/app';

function walk(dir) {
  let files = [];
  for (const f of fs.readdirSync(dir)) {
    const full = path.join(dir, f);
    if (fs.statSync(full).isDirectory()) files.push(...walk(full));
    else if (full.endsWith('.tsx') || full.endsWith('.ts')) files.push(full);
  }
  return files;
}

const files = walk(dir);

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  let original = content;

  content = content.replace(/\{Number\(([^)]+)\)\.toFixed\(3\)\}\s*ر\.ع/g, '{formatCurrency(Number($1))}');
  content = content.replace(/\{([a-zA-Z0-9_?.\(\)]+)\.toFixed\(3\)\}\s*ر\.ع/g, '{formatCurrency($1)}');
  content = content.replace(/\`\$\{([^}]+)\.toFixed\(3\)\}\s*ر\.ع\`/g, 'formatCurrency($1)');
  
  // Custom case for `{Number(displayPrice).toFixed(3)} ر.ع`
  content = content.replace(/\{Number\(([^)]+)\)\.toFixed\(3\)\}\s*ر\.ع/g, '{formatCurrency(Number($1))}');

  if (content !== original) {
    if (!content.includes('import { formatCurrency }')) {
       const lines = content.split('\n');
       let lastImportIndex = 0;
       for(let i = 0; i < lines.length; i++){
          if(lines[i].startsWith('import ')){
             lastImportIndex = i;
          }
       }
       lines.splice(lastImportIndex + 1, 0, "import { formatCurrency } from '@/lib/utils';");
       content = lines.join('\n');
    }
    fs.writeFileSync(file, content);
    console.log('Fixed', file);
  }
}
