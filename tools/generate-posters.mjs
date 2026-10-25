#!/usr/bin/env node
/* Generate print-ready signed QR posters (PNG, 2048×3070, 300 dpi) on the Pratyeksha template.
 *
 *   Online (recommended — the real table list, signed by the server; no secret on this machine):
 *     node generate-posters.mjs --tenant ni_silver_oak_hotel --api https://<backend> --master-key $MASTER_ADMIN_KEY
 *   Offline (same signer, needs the backend's secret):
 *     TABLE_QR_SECRET=… node generate-posters.mjs --tenant ni_silver_oak_hotel --tables 12 [--origin https://pratyeksha-frontend.vercel.app]
 *   Options: --list 1,2,5,A1 (instead of --tables)  --out ./out  --scale 2
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createCanvas, loadImage, registerFont } from 'canvas';
import { renderPoster, withDpi, posterFileName, POSTER } from './qrPoster.mjs';
import { buildUrl } from './qr-core.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const arg = (k, d) => { const i = process.argv.indexOf(`--${k}`); return i > -1 ? process.argv[i + 1] : d; };
const tenant = arg('tenant'); const out = path.resolve(arg('out', './qr-posters')); const scale = Math.max(1, Math.min(3, Number(arg('scale', 2)) || 2));
if (!tenant || !/^[a-zA-Z0-9_-]{1,80}$/.test(tenant)) { console.error('ERROR: --tenant <id> is required (letters, numbers, _ and - only).'); process.exit(1); }

let items;
if (arg('api')) {
  const key = arg('master-key', process.env.MASTER_ADMIN_KEY);
  if (!key) { console.error('ERROR: --master-key (or MASTER_ADMIN_KEY) is required with --api.'); process.exit(1); }
  const r = await fetch(`${arg('api').replace(/\/$/, '')}/api/master/qr-studio/${encodeURIComponent(tenant)}`, { headers: { 'x-master-key': key } });
  if (!r.ok) { console.error(`ERROR: server answered ${r.status}: ${(await r.text()).slice(0, 200)}`); process.exit(1); }
  const d = await r.json();
  items = [...d.tables.map(t => ({ label: t.label, url: t.url })), { label: 'CT', url: d.counter.url }];
} else {
  const secret = process.env.TABLE_QR_SECRET;
  if (!secret || secret.length < 16) { console.error('ERROR: set TABLE_QR_SECRET (the backend\'s secret) or use --api with --master-key.'); process.exit(1); }
  const origin = arg('origin', 'https://pratyeksha-frontend.vercel.app');
  const labels = arg('list') ? arg('list').split(',').map(s => s.trim()).filter(Boolean) : Array.from({ length: Math.max(1, Math.min(500, Number(arg('tables', 12)) || 12)) }, (_, i) => String(i + 1));
  items = [...labels.map(l => ({ label: l, url: buildUrl(secret, origin, tenant, l) })), { label: 'CT', url: buildUrl(secret, origin, tenant, 'CT') }];
}

registerFont(path.join(here, 'assets', 'RobotoCondensed-Bold.ttf'), { family: POSTER.fontFamily, weight: '700' });
const template = await loadImage(path.join(here, 'assets', 'template.png'));
fs.mkdirSync(out, { recursive: true });
const rows = ['label,file,url'];
for (const it of items) {
  const canvas = renderPoster({ url: it.url, label: it.label, template, createCanvas, scale });
  const file = posterFileName(it.label);
  fs.writeFileSync(path.join(out, file), withDpi(new Uint8Array(canvas.toBuffer('image/png')), 300));
  rows.push(`${it.label},${file},${it.url}`); console.log('created', file);
}
fs.writeFileSync(path.join(out, 'manifest.csv'), rows.join('\n'));
console.log(`\nDone: ${items.length} posters in ${out}`);
