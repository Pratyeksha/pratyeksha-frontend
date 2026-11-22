import React, { useEffect, useRef, useState } from "react";
import { motion, useScroll, useTransform, useSpring, useMotionValue, useVelocity, useAnimationFrame, useReducedMotion } from "framer-motion";

/* Effects layer for the landing site: custom cursor (dot, ring, label, click ripple, sparkle trail),
   card tilt, button magnetism, scroll zoom in/out of sections and reveal / scramble of headings.
   Everything is a no-op under prefers-reduced-motion, and the cursor only exists on fine pointers. */

const finePointer = () => typeof window !== "undefined" && window.matchMedia?.("(hover:hover) and (pointer:fine)").matches;
const reducedMotion = () => typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

/* ───────── Cursor ───────── */
function Cursor() {
  const dotX = useMotionValue(-100), dotY = useMotionValue(-100);
  const ringX = useSpring(dotX, { stiffness: 260, damping: 26, mass: 0.6 });
  const ringY = useSpring(dotY, { stiffness: 260, damping: 26, mass: 0.6 });
  const [mode, setMode] = useState("idle");      // idle | link | text | label | down
  const [label, setLabel] = useState("");
  const [visible, setVisible] = useState(false);
  const [ripples, setRipples] = useState([]);
  const ringRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    document.documentElement.classList.add("fx-nocursor");
    const cv = canvasRef.current; const ctx = cv.getContext("2d");
    const fit = () => { const d = Math.min(window.devicePixelRatio || 1, 2); cv.width = innerWidth * d; cv.height = innerHeight * d; ctx.setTransform(d, 0, 0, d, 0, 0); };
    fit();
    let parts = []; let raf = 0; let last = { x: 0, y: 0, t: 0 };
    const loop = () => {
      ctx.clearRect(0, 0, innerWidth, innerHeight);
      parts = parts.filter((p) => p.life > 0);
      for (const p of parts) {
        p.life -= 0.022; p.x += p.vx; p.y += p.vy; p.vy -= 0.012; p.vx *= 0.985;
        ctx.globalAlpha = Math.max(0, p.life) * 0.9;
        ctx.fillStyle = p.c; ctx.beginPath();
        if (p.star) { const r = Math.max(0.01, p.r * p.life * 1.6); ctx.moveTo(p.x, p.y - r); ctx.lineTo(p.x + r * 0.28, p.y - r * 0.28); ctx.lineTo(p.x + r, p.y); ctx.lineTo(p.x + r * 0.28, p.y + r * 0.28); ctx.lineTo(p.x, p.y + r); ctx.lineTo(p.x - r * 0.28, p.y + r * 0.28); ctx.lineTo(p.x - r, p.y); ctx.lineTo(p.x - r * 0.28, p.y - r * 0.28); ctx.closePath(); }
        else ctx.arc(p.x, p.y, Math.max(0.01, p.r * p.life), 0, 6.283);
        ctx.fill();
      }
      raf = parts.length ? requestAnimationFrame(loop) : 0;
    };
    const spawn = (x, y, n, burst) => {
      for (let i = 0; i < n; i++) {
        const a = burst ? Math.random() * 6.283 : -Math.PI / 2 + (Math.random() - 0.5) * 1.6;
        const s = burst ? 1.2 + Math.random() * 2.6 : 0.2 + Math.random() * 0.6;
        parts.push({ x: x + (Math.random() - 0.5) * 6, y: y + (Math.random() - 0.5) * 6, vx: Math.cos(a) * s, vy: Math.sin(a) * s, r: 1.4 + Math.random() * 2.4, life: 1, star: Math.random() < 0.35, c: ["#dfc18d", "#f4ecdc", "#c7a269"][(Math.random() * 3) | 0] });
      }
      if (!raf) raf = requestAnimationFrame(loop);
    };
    const kind = (el) => {
      if (!el || !el.closest) return ["idle", ""];
      const lab = el.closest("[data-cursor]");
      if (lab) return ["label", lab.getAttribute("data-cursor")];
      if (el.closest("input:not([type=checkbox]):not([type=radio]),textarea")) return ["text", ""];
      if (el.closest("a,button,[role=button],[role=radio],summary,select,label")) return ["link", ""];
      return ["idle", ""];
    };
    const move = (e) => {
      dotX.set(e.clientX); dotY.set(e.clientY); setVisible(true);
      const [m, l] = kind(e.target); setMode((p) => (p === "down" ? p : m)); setLabel(l);
      const dx = e.clientX - last.x, dy = e.clientY - last.y; const sp = Math.hypot(dx, dy);
      if (ringRef.current) { ringRef.current.style.setProperty("--st", String(clamp(sp / 90, 0, 0.45))); ringRef.current.style.setProperty("--rot", `${Math.atan2(dy, dx)}rad`); }
      const now = performance.now();
      if (sp > 6 && now - last.t > 24) { spawn(e.clientX, e.clientY, sp > 40 ? 2 : 1, false); last.t = now; }
      last.x = e.clientX; last.y = e.clientY;
    };
    const down = (e) => {
      setMode("down"); spawn(e.clientX, e.clientY, 14, true);
      const id = Math.random(); setRipples((r) => [...r, { id, x: e.clientX, y: e.clientY }]);
      setTimeout(() => setRipples((r) => r.filter((x) => x.id !== id)), 800);
    };
    const up = (e) => { const [m, l] = kind(e.target); setMode(m); setLabel(l); };
    const leave = () => setVisible(false);
    window.addEventListener("pointermove", move, { passive: true });
    window.addEventListener("pointerdown", down, { passive: true });
    window.addEventListener("pointerup", up, { passive: true });
    document.documentElement.addEventListener("mouseleave", leave);
    window.addEventListener("resize", fit);
    return () => {
      document.documentElement.classList.remove("fx-nocursor");
      window.removeEventListener("pointermove", move); window.removeEventListener("pointerdown", down); window.removeEventListener("pointerup", up);
      document.documentElement.removeEventListener("mouseleave", leave); window.removeEventListener("resize", fit);
      cancelAnimationFrame(raf);
    };
  }, [dotX, dotY]);

  return (
    <div className={`fx-cur is-${mode}${visible ? " is-on" : ""}`} aria-hidden="true">
      <canvas ref={canvasRef} className="fx-trail" />
      <motion.div className="fx-ring" ref={ringRef} style={{ x: ringX, y: ringY }}><span className="fx-ring-in"><span className="fx-label">{label}</span></span></motion.div>
      <motion.div className="fx-dot" style={{ x: dotX, y: dotY }} />
      {ripples.map((r) => <span key={r.id} className="fx-ripple" style={{ left: r.x, top: r.y }} />)}
    </div>
  );
}

/* ───────── Tilt, magnet, scroll zoom, reveal, scramble ───────── */
const TILT = ".nx-role,.nx-cell,.nx-use,.nx-pillar,.nx-surface-list li,.nx-explore-grid button,.nx-faq-card,.sc-chip .sc-float";
const MAGNET = ".nx-btn,.nx-cta,.nx-links button,.sc-bot .sc-top,.nx-explore-grid button";
const REVEAL = ".nx-head h2,.nx-head>p,.nx-cta-band h2,.nx-cta-band p,.nx-about-copy p,.nx-cell,.nx-use,.nx-role,.nx-pillar,.nx-surface-list li,.nx-explore-grid button,.nx-faq-card,.nx-q,.nx-contact-row>*";
const SCRAMBLE = ".nx-eyebrow,.nx-kicker,.nx-role small,.nx-cell-n,.nx-use-n";
const GLYPHS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789·/";

function useEffects(page) {
  useEffect(() => {
    if (reducedMotion()) return undefined;
    const cleanups = [];
    const fine = finePointer();

    /* tilt + magnet, delegated so it costs one listener */
    if (fine) {
      let tiltEl = null; let magEl = null;
      const reset = (el) => { if (!el) return; el.classList.remove("is-tilting"); el.style.removeProperty("--rx"); el.style.removeProperty("--ry"); };
      const onMove = (e) => {
        const t = e.target.closest?.(TILT);
        if (t !== tiltEl) { reset(tiltEl); tiltEl = t; }
        if (t) {
          const r = t.getBoundingClientRect(); const px = (e.clientX - r.left) / r.width - 0.5; const py = (e.clientY - r.top) / r.height - 0.5;
          t.classList.add("is-tilting"); t.style.setProperty("--rx", `${(-py * 9).toFixed(2)}deg`); t.style.setProperty("--ry", `${(px * 11).toFixed(2)}deg`);
          t.style.setProperty("--gx", `${(px + 0.5) * 100}%`); t.style.setProperty("--gy", `${(py + 0.5) * 100}%`);
        }
        const m = e.target.closest?.(MAGNET);
        if (m !== magEl) { if (magEl) magEl.style.translate = ""; magEl = m; }
        if (m) { const r = m.getBoundingClientRect(); m.style.translate = `${((e.clientX - (r.left + r.width / 2)) * 0.22).toFixed(1)}px ${((e.clientY - (r.top + r.height / 2)) * 0.3).toFixed(1)}px`; }
      };
      document.addEventListener("pointermove", onMove, { passive: true });
      cleanups.push(() => { document.removeEventListener("pointermove", onMove); reset(tiltEl); if (magEl) magEl.style.translate = ""; });
    }

    /* scroll zoom in / out of every content section */
    const main = document.querySelector(".nx-main");
    const secs = main ? [...main.children].filter((s) => s.tagName === "SECTION" && !/sc-hero|nx-hero|nx-faq|sc-demo/.test(s.className)) : [];
    const targets = secs.map((s) => s.firstElementChild).filter(Boolean);
    let raf = 0;
    const apply = () => {
      raf = 0; const vh = innerHeight;
      for (const el of targets) {
        const r = el.getBoundingClientRect();
        if (r.bottom < -200 || r.top > vh + 200) continue;
        const enter = clamp((vh - r.top) / (vh * 0.6), 0, 1);            // 0 → 1 while it rises into view
        const exit = clamp((r.bottom) / (vh * 0.45), 0, 1);              // 1 → 0 as it leaves the top
        const e = 1 - Math.pow(1 - enter, 3);
        const s = (0.9 + 0.1 * e) * (0.94 + 0.06 * exit);
        el.style.transform = `scale(${s.toFixed(4)})`;
        el.style.opacity = String((0.25 + 0.75 * e) * (0.35 + 0.65 * exit));
        el.style.transformOrigin = `50% ${r.top > 0 ? "0%" : "100%"}`;
      }
    };
    const queue = () => { if (!raf) raf = requestAnimationFrame(apply); };
    targets.forEach((el) => { el.style.willChange = "transform, opacity"; });
    window.addEventListener("scroll", queue, { passive: true }); window.addEventListener("resize", queue);
    apply();
    cleanups.push(() => { window.removeEventListener("scroll", queue); window.removeEventListener("resize", queue); cancelAnimationFrame(raf); targets.forEach((el) => { el.style.transform = ""; el.style.opacity = ""; el.style.willChange = ""; }); });

    /* staggered reveal + scramble on enter */
    const items = main ? [...main.querySelectorAll(REVEAL)].filter((el) => !el.classList.contains("reveal") && !el.closest(".sc-hero")) : [];
    const vh0 = innerHeight;
    items.forEach((el) => {
      const sib = el.parentElement ? [...el.parentElement.children].indexOf(el) : 0;
      el.style.setProperty("--i", String(sib % 6));
      if (el.getBoundingClientRect().top > vh0 * 0.92) el.classList.add("fx-pre");
    });
    const scr = main ? [...main.querySelectorAll(SCRAMBLE)] : [];
    const scramble = (el) => {
      const node = [...el.childNodes].reverse().find((n) => n.nodeType === 3 && n.nodeValue.trim());
      if (!node) return; const orig = node.nodeValue; let f = 0; const total = 22;
      const id = setInterval(() => {
        f++; const k = Math.floor((f / total) * orig.length);
        node.nodeValue = orig.split("").map((c, i) => (i < k || c === " " ? c : GLYPHS[(Math.random() * GLYPHS.length) | 0])).join("");
        if (f >= total) { clearInterval(id); node.nodeValue = orig; }
      }, 32);
      cleanups.push(() => { clearInterval(id); node.nodeValue = orig; });
    };
    const io = new IntersectionObserver((ents) => {
      for (const en of ents) {
        if (!en.isIntersecting) continue;
        const el = en.target; io.unobserve(el);
        if (el.classList.contains("fx-pre")) { el.classList.remove("fx-pre"); el.classList.add("fx-in"); }
        if (scr.includes(el)) scramble(el);
      }
    }, { threshold: 0.2, rootMargin: "0px 0px -6% 0px" });
    items.forEach((el) => io.observe(el)); scr.forEach((el) => io.observe(el));
    cleanups.push(() => { io.disconnect(); items.forEach((el) => el.classList.remove("fx-pre", "fx-in")); });

    return () => cleanups.forEach((fn) => fn());
  }, [page]);
}

export function LandingFX({ page }) {
  const [cursor] = useState(() => finePointer() && !reducedMotion());
  useEffects(page);
  return cursor ? <Cursor /> : null;
}

/* ───────── Scroll-scrubbed statement: words light up as the section scrolls through ───────── */
export function Statement({ eyebrow, text, em }) {
  const ref = useRef(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 0.85", "end 0.45"] });
  const words = text.split(" ");
  const emWords = em ? em.split(" ") : [];
  const all = [...words.map((w) => [w, false]), ...emWords.map((w) => [w, true])];
  return (
    <section className="fx-stmt" ref={ref}>
      <div className="nx-wrap">
        {eyebrow && <span className="sc-eyebrow"><b /> {eyebrow}</span>}
        <p className="fx-stmt-t">
          {all.map(([w, isEm], i) => <Word key={i} i={i} n={all.length} p={scrollYProgress} em={isEm} reduce={reduce}>{w}</Word>)}
        </p>
      </div>
    </section>
  );
}
function Word({ children, i, n, p, em, reduce }) {
  const a = i / n; const b = Math.min(1, a + 1.6 / n);
  const o = useTransform(p, [a, b], [0.14, 1]);
  const y = useTransform(p, [a, b], [10, 0]);
  const blur = useTransform(p, [a, b], ["blur(6px)", "blur(0px)"]);
  return <motion.span className={`fx-w${em ? " is-em" : ""}`} style={reduce ? undefined : { opacity: o, y, filter: blur }}>{children}{" "}</motion.span>;
}

/* ───────── Marquee that speeds up and reverses with scroll velocity ───────── */
export function VelocityMarquee({ words, base = -1.1 }) {
  const x = useMotionValue(0);
  const { scrollY } = useScroll();
  const vel = useVelocity(scrollY);
  const sm = useSpring(vel, { damping: 50, stiffness: 400 });
  const f = useTransform(sm, [-1800, 0, 1800], [-5, 0, 5]);
  const reduce = useReducedMotion();
  const wrap = useTransform(x, (v) => `${(((v % 25) + 25) % 25) - 25}%`);
  useAnimationFrame((t, d) => {
    if (reduce) return;
    x.set(x.get() + (base + f.get()) * (d / 1000) * 3);   // base drift plus scroll velocity; a fast scroll up reverses it
  });
  const row = [...words, ...words, ...words, ...words];
  return (
    <div className="fx-vm" aria-hidden="true">
      <motion.div className="fx-vm-t" style={{ x: wrap }}>
        {row.map((w, i) => <span key={i}>{w}<i /></span>)}
      </motion.div>
    </div>
  );
}
