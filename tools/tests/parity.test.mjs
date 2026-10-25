import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs'; import path from 'node:path'; import os from 'node:os';
import { execFileSync } from 'node:child_process';
import { createCanvas, loadImage, registerFont } from 'canvas';
import jsQR from 'jsqr';
import { sign, buildUrl } from '../qr-core.mjs';
import { renderPoster, POSTER } from '../qrPoster.mjs';

const SECRET = 'parity_secret_0123456789abcdef';
// Vectors produced by the BACKEND module (pratyeksha-backend/qr-security.js). If these ever drift, printed QR codes stop working.
test('signer matches the backend signer byte-for-byte', () => {
  assert.equal(sign(SECRET, 'ni_silver_oak_hotel', '1'), '9a6fe444df060674b85e');
  assert.equal(sign(SECRET, 'ni_silver_oak_hotel', '10'), '56255a86122140aa9a8c');
  assert.equal(sign(SECRET, 'ni_silver_oak_hotel', 'CT'), 'c4190b1cad0ad762b830');
  assert.equal(sign(SECRET, 'ni_silver_oak_hotel', 'counter'), 'c4190b1cad0ad762b830');
  assert.equal(buildUrl(SECRET, 'https://pratyeksha-frontend.vercel.app/', 'ni_silver_oak_hotel', 'CT'), 'https://pratyeksha-frontend.vercel.app/ni_silver_oak_hotel?table=CT&sig=c4190b1cad0ad762b830');
});

test('CLI writes Table_N.png + Counter.png whose QR decodes to the signed URL', async () => {
  const out = fs.mkdtempSync(path.join(os.tmpdir(), 'px-'));
  execFileSync('node', ['generate-posters.mjs', '--tenant', 'ni_silver_oak_hotel', '--tables', '3', '--out', out], { env: { ...process.env, TABLE_QR_SECRET: SECRET }, cwd: path.resolve(import.meta.dirname, '..') });
  assert.deepEqual(fs.readdirSync(out).sort(), ['Counter.png', 'Table_1.png', 'Table_2.png', 'Table_3.png', 'manifest.csv']);
  const { default: png } = { default: null }; void png;
  registerFont(path.resolve(import.meta.dirname, '../assets/RobotoCondensed-Bold.ttf'), { family: POSTER.fontFamily, weight: '700' });
  for (const [file, label] of [['Table_2.png', '2'], ['Counter.png', 'CT']]) {
    const img = await loadImage(path.join(out, file)); assert.equal(img.width, 2048); assert.equal(img.height, 3070);
    const c = createCanvas(img.width, img.height); const ctx = c.getContext('2d'); ctx.drawImage(img, 0, 0);
    const P = POSTER.qrPanel; const d = ctx.getImageData(P.x * 2, P.y * 2, P.size * 2, P.size * 2);
    const res = jsQR(d.data, d.width, d.height);
    assert.equal(res?.data, buildUrl(SECRET, 'https://pratyeksha-frontend.vercel.app', 'ni_silver_oak_hotel', label), `${file} QR decodes to the signed URL`);
  }
  const m = fs.readFileSync(path.join(out, 'manifest.csv'), 'utf8'); assert.ok(m.includes('CT,Counter.png,'));
});
