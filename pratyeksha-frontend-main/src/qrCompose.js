// ─────────────────────────────────────────────────────────────────────────────
// QR Studio engine: detects the QR placeholder and the table-label box of ANY template image, then draws a real, scannable QR code
// and the table label in exactly those places. Everything else in the template is left untouched.
// DOM-independent (the caller supplies createCanvas), so the same code runs in the browser and in Node tests.
// ─────────────────────────────────────────────────────────────────────────────
import QRCode from 'qrcode';
import jsQR from 'jsqr';

const WHITE = 238;                                   // "paper white" threshold for the QR placeholder
const isTan = (r, g, b) => r > 140 && g > 105 && b > 75 && (r - b) > 30;   // the template's antique-gold label text

/** Largest roughly-square run of white pixels = the QR placeholder. */
function detectQrBox({ data, width, height }) {
  const n = width * height;
  const white = new Uint8Array(n);
  for (let i = 0, p = 0; i < n; i++, p += 4) white[i] = (data[p] >= WHITE && data[p + 1] >= WHITE && data[p + 2] >= WHITE) ? 1 : 0;
  const seen = new Uint8Array(n);
  const stack = new Int32Array(n);
  let best = null;
  for (let start = 0; start < n; start++) {
    if (!white[start] || seen[start]) continue;
    let sp = 0, area = 0, x0 = width, x1 = 0, y0 = height, y1 = 0;
    stack[sp++] = start; seen[start] = 1;
    while (sp) {
      const i = stack[--sp]; const x = i % width, y = (i / width) | 0;
      area++; if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y;
      if (x > 0 && white[i - 1] && !seen[i - 1]) { seen[i - 1] = 1; stack[sp++] = i - 1; }
      if (x < width - 1 && white[i + 1] && !seen[i + 1]) { seen[i + 1] = 1; stack[sp++] = i + 1; }
      if (y > 0 && white[i - width] && !seen[i - width]) { seen[i - width] = 1; stack[sp++] = i - width; }
      if (y < height - 1 && white[i + width] && !seen[i + width]) { seen[i + width] = 1; stack[sp++] = i + width; }
    }
    const w = x1 - x0 + 1, h = y1 - y0 + 1;
    const square = Math.min(w, h) / Math.max(w, h);
    if (square < 0.9 || Math.min(w, h) < Math.min(width, height) * 0.08) continue;   // letters, lines, icons are not it
    if (!best || w * h > best.w * best.h) best = { x: x0, y: y0, w, h };
  }
  if (!best) return null;
  // rounded corners: the top row of a rounded square starts `radius` pixels in
  let off = 0;
  for (let x = best.x; x < best.x + best.w; x++) { const p = (best.y * width + x) * 4; if (data[p] >= WHITE && data[p + 1] >= WHITE && data[p + 2] >= WHITE) { off = x - best.x; break; } }
  const size = Math.round((best.w + best.h) / 2);
  return { x: best.x, y: best.y, size, radius: Math.max(0, Math.min(Math.round(off * 1.05), Math.floor(size / 4))) };
}

/** Thick gold strokes only (the big table number); thin frame lines / underlines vanish under a 9x9 erosion. */
function detectLabel({ data, width, height }, qr) {
  const zx0 = Math.min(width - 1, qr.x + qr.size + 12), zx1 = width;
  const zy0 = Math.max(0, qr.y - 40), zy1 = Math.min(height, qr.y + Math.round(qr.size * 0.45));
  const zw = zx1 - zx0, zh = zy1 - zy0;
  if (zw < 30 || zh < 30) return null;
  const tan = new Uint8Array(zw * zh);
  for (let y = 0; y < zh; y++) for (let x = 0; x < zw; x++) { const p = ((zy0 + y) * width + zx0 + x) * 4; tan[y * zw + x] = isTan(data[p], data[p + 1], data[p + 2]) ? 1 : 0; }
  // summed-area table → "all 9x9 neighbours are tan"
  const K = 4, W1 = zw + 1;
  const sat = new Int32Array(W1 * (zh + 1));
  for (let y = 0; y < zh; y++) { let row = 0; for (let x = 0; x < zw; x++) { row += tan[y * zw + x]; sat[(y + 1) * W1 + x + 1] = sat[y * W1 + x + 1] + row; } }
  const sum = (x0, y0, x1, y1) => sat[(y1 + 1) * W1 + x1 + 1] - sat[y0 * W1 + x1 + 1] - sat[(y1 + 1) * W1 + x0] + sat[y0 * W1 + x0];
  let x0 = zw, x1 = -1, y0 = zh, y1 = -1;
  for (let y = K; y < zh - K; y++) for (let x = K; x < zw - K; x++) {
    if (sum(x - K, y - K, x + K, y + K) === (2 * K + 1) * (2 * K + 1)) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
  }
  if (x1 < 0) return null;
  const g = { x: zx0 + x0 - K, y: zy0 + y0 - K, w: x1 - x0 + 1 + 2 * K, h: y1 - y0 + 1 + 2 * K };
  const med = (arr) => { arr.sort((a, b) => a - b); return arr[(arr.length / 2) | 0]; };
  const rs = [], gs = [], bs = [], br = [], bg = [], bb = [];
  const pad = 10;
  for (let y = g.y - pad; y < g.y + g.h + pad; y++) for (let x = g.x - pad; x < g.x + g.w + pad; x++) {
    if (x < 0 || y < 0 || x >= width || y >= height) continue;
    const p = (y * width + x) * 4; const inside = x >= g.x && x < g.x + g.w && y >= g.y && y < g.y + g.h;
    if (isTan(data[p], data[p + 1], data[p + 2])) { if (inside) { rs.push(data[p]); gs.push(data[p + 1]); bs.push(data[p + 2]); } }
    else if (!inside) { br.push(data[p]); bg.push(data[p + 1]); bb.push(data[p + 2]); }
  }
  if (!rs.length || !br.length) return null;
  const color = [med(rs), med(gs), med(bs)], bgc = [med(br), med(bg), med(bb)];
  // the dark block the number sits on (limits how wide a long label may be)
  let block = { x: g.x - 12, y: g.y - 12, w: g.w + 24, h: g.h + 24 };
  const sx = Math.max(0, g.x - 6), sy = g.y + (g.h >> 1);
  const near = (p) => Math.max(Math.abs(data[p] - bgc[0]), Math.abs(data[p + 1] - bgc[1]), Math.abs(data[p + 2] - bgc[2])) <= 5;
  if (near((sy * width + sx) * 4)) {
    const seen = new Uint8Array(width * height); const stack = []; let bx0 = sx, bx1 = sx, by0 = sy, by1 = sy, count = 0;
    stack.push(sy * width + sx); seen[sy * width + sx] = 1;
    while (stack.length && count < width * height * 0.15) {
      const i = stack.pop(); const x = i % width, y = (i / width) | 0; count++;
      if (x < bx0) bx0 = x; if (x > bx1) bx1 = x; if (y < by0) by0 = y; if (y > by1) by1 = y;
      for (const j of [i - 1, i + 1, i - width, i + width]) { if (j < 0 || j >= width * height || seen[j]) continue; const jx = j % width; if (Math.abs(jx - x) > 1) continue; if (near(j * 4)) { seen[j] = 1; stack.push(j); } }
    }
    if (count < width * height * 0.15 && bx1 - bx0 > g.w && by1 - by0 > g.h) block = { x: bx0, y: by0, w: bx1 - bx0 + 1, h: by1 - by0 + 1 };
  }
  return { glyph: g, color, bg: bgc, block };
}

/** Everything the renderer needs, found automatically from the template pixels. */
export function detectTemplate(imageData) {
  const qr = detectQrBox(imageData);
  if (!qr) return { error: 'Could not find the white QR placeholder in this template.' };
  const label = detectLabel(imageData, qr);
  return { qr, label, width: imageData.width, height: imageData.height, warning: label ? '' : 'Could not find the table-number label; only the QR will be replaced.' };
}

const rrect = (ctx, x, y, w, h, r) => {
  const rr = Math.max(0, Math.min(r, w / 2, h / 2));
  ctx.beginPath(); ctx.moveTo(x + rr, y); ctx.arcTo(x + w, y, x + w, y + h, rr); ctx.arcTo(x + w, y + h, x, y + h, rr); ctx.arcTo(x, y + h, x, y, rr); ctx.arcTo(x, y, x + w, y, rr); ctx.closePath();
};

/**
 * Draw one card.
 *  template : drawable image (browser Image/ImageBitmap or Node canvas Image) with .width/.height
 *  layout   : result of detectTemplate (possibly edited by the user)
 *  scale    : 1 = template resolution; 2/3 = larger print size (background is upscaled, QR + label stay razor sharp)
 */
export async function renderCard({ createCanvas, template, layout, scanUrl, label, scale = 1, level = 'Q', fontFamily = '"Roboto Condensed", "Arial Narrow", sans-serif', fontWeight = 700 }) {
  const W = Math.round(layout.width * scale), H = Math.round(layout.height * scale);
  const canvas = createCanvas(W, H); const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(template, 0, 0, W, H);

  // ── QR code, drawn on its own pixel grid so every module is a whole number of pixels (maximum scan reliability) ──
  const q = layout.qr; const S = Math.round(q.size * scale); const X = Math.round(q.x * scale), Y = Math.round(q.y * scale);
  const bleed = Math.max(1, Math.round(1.5 * scale));                       // also covers the anti-aliased edge of the old box
  ctx.fillStyle = '#ffffff'; rrect(ctx, X - bleed, Y - bleed, S + 2 * bleed, S + 2 * bleed, Math.round(q.radius * scale) + bleed); ctx.fill();
  const qr = QRCode.create(scanUrl, { errorCorrectionLevel: level });
  const n = qr.modules.size;
  const px = Math.floor(S / (n + 8));                                        // keeps the 4-module quiet zone the QR standard requires
  if (px < 2) throw new Error('The QR placeholder is too small for this link. Use a larger template or a higher output scale.');
  const grid = n * px; const ox = X + Math.floor((S - grid) / 2), oy = Y + Math.floor((S - grid) / 2);
  ctx.fillStyle = '#0b0b0b';
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (qr.modules.data[r * n + c]) ctx.fillRect(ox + c * px, oy + r * px, px, px);

  // ── Table label: paint over the old number with the box's own background, then draw the new one in the same colour & size ──
  const lb = layout.label;
  if (lb && label != null && String(label).trim() !== '') {
    const g = lb.glyph; const pad = Math.round(8 * scale);
    ctx.fillStyle = `rgb(${lb.bg[0]},${lb.bg[1]},${lb.bg[2]})`;
    ctx.fillRect(Math.round(g.x * scale) - pad, Math.round(g.y * scale) - pad, Math.round(g.w * scale) + 2 * pad, Math.round(g.h * scale) + 2 * pad);
    const text = String(label).trim();
    ctx.fillStyle = `rgb(${lb.color[0]},${lb.color[1]},${lb.color[2]})`; ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
    ctx.font = `${fontWeight} 100px ${fontFamily}`;
    const capRatio = (ctx.measureText('H').actualBoundingBoxAscent || 71) / 100;
    let fs = (g.h * scale) / capRatio;                                       // same cap-height as the number in the template
    ctx.font = `${fontWeight} ${fs}px ${fontFamily}`;
    const maxW = Math.max(20, (lb.block.w - 16)) * scale;                    // never wider than the dark box
    const w = ctx.measureText(text).width;
    if (w > maxW) { fs *= maxW / w; ctx.font = `${fontWeight} ${fs}px ${fontFamily}`; }
    const capH = capRatio * fs;
    const cx = (g.x + g.w / 2) * scale, cy = (g.y + g.h / 2) * scale;
    ctx.fillText(text, cx, cy + capH / 2);
  }
  return canvas;
}

/** Decodes the QR printed on a rendered card and returns the URL it contains (null if it cannot be read). */
export function decodeCard(canvas, layout, scale = 1) {
  const q = layout.qr; const m = Math.round(8 * scale);
  const x = Math.max(0, Math.round(q.x * scale) - m), y = Math.max(0, Math.round(q.y * scale) - m);
  const s = Math.round(q.size * scale) + 2 * m;
  const w = Math.min(canvas.width - x, s), h = Math.min(canvas.height - y, s);
  const img = canvas.getContext('2d').getImageData(x, y, w, h);
  const r = jsQR(img.data, img.width, img.height);
  return r ? r.data : null;
}

/** File-name safe label: 7 -> Table_07, CT -> Counter_CT */
export const cardFileName = (label) => (/^\d+$/.test(String(label)) ? `Table_${String(label).padStart(2, '0')}.png` : `Counter_${String(label).replace(/[^A-Za-z0-9_-]/g, '')}.png`);
