import fs from 'node:fs';
import path from 'node:path';

// Run before deploying, because Vercel reads routing configuration before building.
const input = process.argv[2] || process.env.API_PROXY_TARGET;
if (!input) throw new Error('Supply your backend HTTPS URL: npm run configure:deployment -- https://YOUR-BACKEND.onrender.com');
const target = new URL(input);
if (target.protocol !== 'https:' || target.username || target.password || target.search || target.hash) {
  throw new Error('Backend URL must use HTTPS and contain no credentials, query, or fragment.');
}
if (!['/', '/api', '/api/'].includes(target.pathname)) throw new Error('Supply the backend origin, without a custom path.');
const file = path.resolve('vercel.json');
const config = JSON.parse(fs.readFileSync(file, 'utf8'));
config.rewrites = [
  { source: '/api/:path*', destination: `${target.origin}/api/:path*` },
  ...(config.rewrites || []).filter((rule) => rule.source !== '/api/:path*'),
];
fs.writeFileSync(file, JSON.stringify(config, null, 2) + '\n');
console.log('Configured same-origin API proxy. Set VITE_API_BASE_URL=/api on Vercel.');
