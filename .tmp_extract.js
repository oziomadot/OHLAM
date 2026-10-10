const fs = require('fs');
const path = require('path');
const prefixes = new Set();
const exts = ['.ts', '.tsx'];
function walk(dir) {
  for (const f of fs.readdirSync(dir)) {
    const p = path.join(dir, f);
    const st = fs.statSync(p);
    if (st.isDirectory()) {
      if (!['node_modules', '.git', 'dist', '.expo'].includes(f)) walk(p);
    } else if (exts.some(e => f.endsWith(e))) {
      const s = fs.readFileSync(p, 'utf8');
      const re = /(?:import\s+.*?\s+from\s+|import\s*\(\s*)['"]([^'"]+)['"]/g;
      let m;
      while ((m = re.exec(s))) {
        const spec = m[1];
        if (!spec.startsWith('.') && !spec.startsWith('@') && !spec.startsWith('/')) {
          prefixes.add(spec.split('/')[0]);
        }
      }
    }
  }
}
walk('.');
console.log([...prefixes].sort().join('\n'));
