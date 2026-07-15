const fs = require('fs');

const file = 'index.html';
let html = fs.readFileSync(file, 'utf8');

const replacements = [
  {
    from: '          grid.appendChild(card););\n          }\n        });',
    to: '          grid.appendChild(card);\n        });',
    label: 'staff/gallery trailing administrator block'
  },
  {
    from: "          }););\n          }\n        });",
    to: "          });\n        });",
    label: 'notice trailing administrator block'
  }
];

for (const { from, to, label } of replacements) {
  if (html.includes(from)) html = html.replaceAll(from, to);
  console.log(`Checked ${label}`);
}

if (html.includes('););')) throw new Error('Malformed token );); remains in public index.html');
if (html.includes('renderAdminDashboard')) throw new Error('Administrator dashboard runtime remains in public index.html');
if (html.includes('submitAdminLogin')) throw new Error('Administrator login runtime remains in public index.html');

const moduleStart = html.indexOf('<script type="module">');
const moduleEnd = html.indexOf('</script>', moduleStart);
if (moduleStart < 0 || moduleEnd < 0) throw new Error('Module script block not found');
const script = html.slice(moduleStart, moduleEnd);

const pairs = [['(', ')'], ['{', '}'], ['[', ']']];
for (const [open, close] of pairs) {
  const openCount = [...script].filter(ch => ch === open).length;
  const closeCount = [...script].filter(ch => ch === close).length;
  if (openCount !== closeCount) {
    throw new Error(`Delimiter count mismatch for ${open}${close}: ${openCount}/${closeCount}`);
  }
}

fs.writeFileSync(file, html);
console.log('Public split syntax repair completed.');

// Trigger public split validation after workflow registration.
