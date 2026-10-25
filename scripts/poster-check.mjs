// Dev check: render posters with node-canvas, decode the QR with jsQR, and write PNGs to /tmp for visual inspection.
import { createCanvas, loadImage, registerFont } from 'canvas';
import jsQR from 'jsqr';
import fs from 'node:fs';
import { renderPoster, withDpi, posterFileName, POSTER } from '../src/qrPoster.js';
registerFont(process.env.POSTER_FONT_TTF || '/tmp/RobotoCondensed-Bold.ttf', { family: POSTER.fontFamily, weight: '700' });
const template = await loadImage('public/qr-studio/template.png');
const cases = [['https://pratyeksha-frontend.vercel.app/qa_alpha?table=10&sig=0123456789abcdef0123', '10'], ['https://pratyeksha-frontend.vercel.app/qa_alpha?table=CT&sig=fedcba98765432100123', 'CT'], ['https://pratyeksha-frontend.vercel.app/qa_alpha?table=101&sig=aaaaaaaaaaaaaaaaaaaa', '101'], ['https://pratyeksha-frontend.vercel.app/a_very_long_tenant_id_for_stress_test_0123456789?table=A12&sig=bbbbbbbbbbbbbbbbbbbb', 'A12']];
for (const [url, label] of cases) {
  const c = renderPoster({ url, label, template, createCanvas, scale: 2 });
  const png = withDpi(new Uint8Array(c.toBuffer('image/png')), 300);
  fs.writeFileSync(`/tmp/${posterFileName(label)}`, png);
  const ctx = c.getContext('2d'); const P = POSTER.qrPanel; const img = ctx.getImageData(P.x * 2, P.y * 2, P.size * 2, P.size * 2);
  const res = jsQR(img.data, img.width, img.height);
  console.log(label.padEnd(4), 'decoded:', res ? (res.data === url ? 'MATCH' : 'MISMATCH ' + res.data) : 'FAILED', '| size', c.width + 'x' + c.height, '| bytes', png.length);
}
