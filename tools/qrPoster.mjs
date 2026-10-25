/**
 * QR poster compositor — draws a tenant's signed QR code and its table / counter label onto the Pratyeksha
 * "SEE IT. CRAVE IT." template. ONLY the QR panel and the number badge are replaced; everything else is the template.
 *
 * Environment-agnostic: callers inject `createCanvas(w, h)` and the loaded template image, so the same code runs in the
 * browser (Master Admin → QR Studio) and in Node (tests / tools CLI, with node-canvas).
 *
 * Geometry is measured from the supplied template (1024 × 1535). Output is rendered at `scale`× (default 2 → 2048 × 3070,
 * which is ≈ 17 × 26 cm at 300 dpi) with the QR drawn as crisp vector squares at that resolution.
 */
import QRCode from 'qrcode';

export const POSTER = Object.freeze({
  width: 1024, height: 1535,
  qrPanel: { x: 316, y: 675, size: 384, radius: 22, padding: 20 },      // white rounded panel inside the gold frame
  badge: { x: 808, y: 694, w: 127, h: 116, cx: 871.5, baseline: 781, maxTextW: 104, capFont: 98, color: '#c9a486', bg: '#0b0908' },
  fontFamily: 'PxPosterCondensed',
});

/** Smaller font for longer labels so "101" / "A12" still sit inside the badge. */
export function fitFontSize(measure, label) {
  const w = measure(label, POSTER.badge.capFont);
  return w <= POSTER.badge.maxTextW ? POSTER.badge.capFont : Math.floor(POSTER.badge.capFont * POSTER.badge.maxTextW / w);
}

/** Pure QR layout: integer module size so every module is pixel-aligned (sharp, scanner-friendly). */
export function layoutQr(url, scale = 2, ecc = 'Q') {
  const qr = QRCode.create(url, { errorCorrectionLevel: ecc });
  const n = qr.modules.size;
  const panel = POSTER.qrPanel.size * scale;
  const inner = panel - POSTER.qrPanel.padding * 2 * scale;
  const mod = Math.max(1, Math.floor(inner / (n + 0)));
  const drawn = mod * n;
  const origin = Math.round((panel - drawn) / 2);
  return { n, mod, drawn, origin, data: qr.modules.data, version: qr.version };
}

/**
 * @param {{url:string,label:string,template:any,createCanvas:(w:number,h:number)=>any,scale?:number}} o
 * @returns the canvas containing the finished poster
 */
export function renderPoster({ url, label, template, createCanvas, scale = 2 }) {
  const W = POSTER.width * scale, H = POSTER.height * scale;
  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(template, 0, 0, W, H);

  // ── QR panel: repaint white (covers any template placeholder) then draw modules ──
  const P = POSTER.qrPanel, s = scale;
  ctx.fillStyle = '#ffffff';
  roundRect(ctx, P.x * s, P.y * s, P.size * s, P.size * s, P.radius * s); ctx.fill();
  const q = layoutQr(url, scale);
  ctx.fillStyle = '#000000';
  const ox = P.x * s + q.origin, oy = P.y * s + q.origin;
  for (let r = 0; r < q.n; r++) for (let c = 0; c < q.n; c++) if (q.data[r * q.n + c]) ctx.fillRect(ox + c * q.mod, oy + r * q.mod, q.mod, q.mod);

  // ── Badge: clear, then draw the label in the template's tan ──
  const B = POSTER.badge;
  ctx.fillStyle = B.bg; ctx.fillRect(B.x * s, B.y * s, B.w * s, B.h * s);
  const text = String(label);
  const measure = (t, size) => { ctx.font = `700 ${size * s}px ${POSTER.fontFamily}, "Roboto Condensed", "Arial Narrow", sans-serif`; return ctx.measureText(t).width / s; };
  const size = fitFontSize(measure, text);
  ctx.font = `700 ${size * s}px ${POSTER.fontFamily}, "Roboto Condensed", "Arial Narrow", sans-serif`;
  ctx.fillStyle = B.color; ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
  // keep the optical centre of the digits on the badge centre regardless of font size
  const baseline = B.y + B.h / 2 + (B.baseline - (B.y + B.h / 2)) * (size / B.capFont);
  ctx.fillText(text, B.cx * s, baseline * s);
  return canvas;
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
}

// ── PNG helper: embed a 300-dpi pHYs chunk so print shops get the physical size right ──
const CRC_TABLE = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
const crc32 = (buf) => { let c = 0xffffffff; for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
export function withDpi(png, dpi = 300) {
  const ppm = Math.round(dpi / 0.0254);
  const chunk = new Uint8Array(21); const dv = new DataView(chunk.buffer);
  dv.setUint32(0, 9); chunk.set([0x70, 0x48, 0x59, 0x73], 4);                    // length 9, "pHYs"
  dv.setUint32(8, ppm); dv.setUint32(12, ppm); chunk[16] = 1;                      // x, y pixels per metre, unit = metre
  dv.setUint32(17, crc32(chunk.subarray(4, 17)));
  const out = new Uint8Array(png.length + 21);
  const ihdrEnd = 8 + 8 + 13 + 4;                                                  // signature + IHDR chunk
  out.set(png.subarray(0, ihdrEnd), 0); out.set(chunk, ihdrEnd); out.set(png.subarray(ihdrEnd), ihdrEnd + 21);
  return out;
}

export const posterFileName = (label) => (String(label).toUpperCase() === 'CT' ? 'Counter.png' : `Table_${String(label).replace(/[^A-Za-z0-9_-]+/g, '-')}.png`);
