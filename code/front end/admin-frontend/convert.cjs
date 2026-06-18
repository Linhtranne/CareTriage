const fs = require('fs');
const { formatHex, parse } = require('culori');
const path = 'src/constants/design-tokens.ts';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(/oklch\(([^)]+)\)/g, (match, val) => {
  const hex = formatHex(parse('oklch(' + val + ')'));
  return hex ? hex : match;
});

// Fix card shadows
content = content.replace(/card: '([^']+)'/, "card: '0 1px 3px rgba(10, 15, 20, 0.08), 0 1px 2px rgba(10, 15, 20, 0.06)'");
content = content.replace(/elevated: '([^']+)'/, "elevated: '0 10px 25px rgba(10, 15, 20, 0.10), 0 4px 10px rgba(10, 15, 20, 0.05)'");

fs.writeFileSync(path, content);
console.log('Converted oklch to hex');
