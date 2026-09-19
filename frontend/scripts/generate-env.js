const fs = require('fs');
const path = require('path');

// minimal arg parsing: allow --qtmdb=...
const args = process.argv.slice(2);
const argMap = {};
args.forEach(a => {
  const m = a.match(/^--([^=]+)=(.*)$/);
  if (m) argMap[m[1]] = m[2];
});

const qtmdbBase = process.env.NG_QTMDB_APP_BASE_URL || argMap.qtmdb || 'https://dashboard.qtmdev.quicare.com/dashboard';
const tenantsApiBase = process.env.NG_TENANTS_API_BASE_URL || argMap.tenantsApi || 'https://tenants.qtmdev.quicare.com/api/tenants';

// write into the Angular build browser folder so the file ends up under dist/.../browser/assets
const distEnvPath = path.resolve(__dirname, '..', 'dist', 'tenants-app-frontend', 'browser', 'assets', 'env.js');
const content = `// Generated env.js
(function (window) {
  window.NG_QTMDB_APP_BASE_URL = "${qtmdbBase}";
  window.__env = window.__env || {};
  window.__env.dashboardUrl = window.__env.dashboardUrl || "${qtmdbBase}";
  window.__env.apiBaseUrl = window.__env.apiBaseUrl || "${tenantsApiBase}";
})(window);
`;

try {
  fs.mkdirSync(path.dirname(distEnvPath), { recursive: true });
  fs.writeFileSync(distEnvPath, content, 'utf8');
  console.log(`env.js written to ${distEnvPath}`);
} catch (e) {
  console.error('Failed to write env.js:', e);
  process.exit(1);
}
