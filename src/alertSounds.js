// ─────────────────────────────────────────────────────────────────────────────
// Operator alerts: a DIFFERENT bell for every kind of alert + a spoken call-out.
// The bells are synthesised with the Web Audio API, so there are no sound files to host, nothing to download, and every
// alert has its own recognisable tune even with the screen turned away.
// ─────────────────────────────────────────────────────────────────────────────

let ctx = null;
const getCtx = () => {
  try {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
    }
    if (ctx.state === 'suspended') ctx.resume().catch(() => {});
    return ctx;
  } catch { return null; }
};

// Browsers only allow sound after a user gesture: unlock the audio engine on the first tap / key press.
if (typeof window !== 'undefined') {
  const unlock = () => {
    getCtx();
    try { window.speechSynthesis && window.speechSynthesis.getVoices(); } catch { /* ignore */ }
    window.removeEventListener('pointerdown', unlock);
    window.removeEventListener('keydown', unlock);
  };
  window.addEventListener('pointerdown', unlock, { once: false });
  window.addEventListener('keydown', unlock, { once: false });
}

// A struck bell: a few inharmonic partials with an exponential decay.
const ring = (ac, freq, start, dur = 0.9, vol = 0.32, type = 'sine') => {
  const partials = type === 'sine' ? [[1, 1], [2.76, 0.45], [5.4, 0.22], [8.93, 0.1]] : [[1, 1], [2, 0.3]];
  const master = ac.createGain();
  master.gain.setValueAtTime(0.0001, start);
  master.gain.exponentialRampToValueAtTime(vol, start + 0.012);
  master.gain.exponentialRampToValueAtTime(0.0001, start + dur);
  master.connect(ac.destination);
  partials.forEach(([mult, amp]) => {
    const o = ac.createOscillator();
    const g = ac.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq * mult, start);
    g.gain.setValueAtTime(amp, start);
    o.connect(g); g.connect(master);
    o.start(start); o.stop(start + dur + 0.05);
  });
};

// note frequencies
const N = { A3: 220, D4: 293.7, F4: 349.2, A4: 440, C5: 523.3, D5: 587.3, E5: 659.3, G5: 784, A5: 880, B5: 987.8, C6: 1046.5, D6: 1174.7, E6: 1318.5, G6: 1568, A6: 1760 };

// Every alert type → its own melody: [freq, offsetSeconds, durationSeconds, volume?, wave?]
export const ALERT_TUNES = {
  order:         [[N.C6, 0, 0.9], [N.E6, 0.28, 1.2]],                                         // new kitchen order: ding-dong ↑
  waiter:        [[N.A6, 0, 0.5], [N.A6, 0.22, 0.5], [N.A6, 0.44, 0.9]],                      // call waiter: triple ping
  bill:          [[N.G6, 0, 0.7], [N.E6, 0.25, 0.7], [N.C6, 0.5, 1.2]],                       // settlement request: ding-dong-dong ↓
  waitlist:      [[N.C5, 0, 1.0], [N.E5, 0.2, 1.0], [N.G5, 0.4, 1.4]],                        // walk-in joined: soft arpeggio
  pickup:        [[N.E5, 0, 1.0], [N.B5, 0.3, 1.0], [N.E5, 0.9, 1.0], [N.B5, 1.2, 1.4]],     // pickup requested: double bell
  pickupReady:   [[N.G5, 0, 0.6], [N.D6, 0.18, 1.2]],                                         // pickup marked ready
  reservation:   [[N.G5, 0, 0.7], [N.B5, 0.18, 0.7], [N.D6, 0.36, 0.7], [N.G6, 0.54, 1.5]],   // reservation: bright 4-note rise
  table:         [[N.A4, 0, 1.8, 0.4]],                                                       // table occupied: single low gong
  assigned:      [[N.D5, 0, 0.8], [N.A5, 0.2, 1.2]],                                          // table assigned
  cancelled:     [[N.F4, 0, 1.2, 0.3], [N.D4, 0.3, 1.4, 0.3]],                                // cancellation: dull fall
  lowStock:      [[N.D5, 0, 0.5, 0.3, 'triangle'], [N.A4, 0.35, 0.5, 0.3, 'triangle'], [N.D5, 0.7, 0.5, 0.3, 'triangle'], [N.A4, 1.05, 0.7, 0.3, 'triangle']],
  outOfStock:    [[N.A4, 0, 0.7, 0.35, 'triangle'], [N.F4, 0.35, 0.7, 0.35, 'triangle'], [N.D4, 0.7, 1.2, 0.35, 'triangle']],
  ingredientOut: [[N.A3, 0, 0.9, 0.4, 'triangle'], [N.D4, 0.3, 0.9, 0.4, 'triangle'], [N.A3, 0.6, 1.3, 0.4, 'triangle']],
  expiry:        [[N.C5, 0, 0.6], [N.C5, 0.3, 0.6], [N.G5, 0.9, 1.2]],                        // expiring stock: tick-tick … tock
  aggregator:    [[N.E6, 0, 0.35], [N.C6, 0.2, 0.35], [N.E6, 0.4, 0.35], [N.C6, 0.6, 0.35], [N.E6, 0.8, 0.35], [N.C6, 1.0, 0.9]], // Swiggy/Zomato: urgent ring
  sessionExpired:[[N.A5, 0, 0.8], [N.F4, 0.45, 0.8], [N.A5, 0.9, 0.8], [N.F4, 1.35, 1.4]],   // aggregator session lost
  generic:       [[N.C6, 0, 1.0]],
};

export const playAlertSound = (kind = 'generic') => {
  const ac = getCtx();
  if (!ac) return;
  const tune = ALERT_TUNES[kind] || ALERT_TUNES.generic;
  const t0 = ac.currentTime + 0.02;
  try {
    tune.forEach(([f, off, dur, vol, wave]) => ring(ac, f, t0 + off, dur, vol || 0.32, wave || 'sine'));
  } catch { /* audio unavailable */ }
};

// ── Spoken call-out ──────────────────────────────────────────────────────────
let preferredVoice = null;
const pickVoice = () => {
  if (preferredVoice) return preferredVoice;
  try {
    const voices = window.speechSynthesis.getVoices() || [];
    preferredVoice = voices.find(v => /en-IN/i.test(v.lang)) || voices.find(v => /^en/i.test(v.lang)) || null;
  } catch { /* ignore */ }
  return preferredVoice;
};
export const speak = (text, { repeat = 1 } = {}) => {
  try {
    if (typeof window === 'undefined' || !window.speechSynthesis || !text) return;
    window.speechSynthesis.cancel(); // never queue a long backlog of old announcements
    for (let i = 0; i < Math.max(1, repeat); i++) {
      const u = new SpeechSynthesisUtterance(String(text));
      const v = pickVoice();
      if (v) { u.voice = v; u.lang = v.lang; } else u.lang = 'en-IN';
      u.rate = 0.95; u.pitch = 1; u.volume = 1;
      window.speechSynthesis.speak(u);
    }
  } catch { /* speech unavailable */ }
};

// Bell first, then the voice (the bell fades while the sentence starts).
export const callOut = (kind, sentence, opts) => {
  playAlertSound(kind);
  setTimeout(() => speak(sentence, opts), 1100);
};

const fmtTime = (d) => {
  const dt = d instanceof Date ? d : new Date(d);
  if (Number.isNaN(dt.getTime())) return '';
  return dt.toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour: 'numeric', minute: '2-digit', hour12: true });
};
export const formatAlertTime = fmtTime;
