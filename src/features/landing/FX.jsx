import React, { useEffect, useRef, useState } from "react";
import { motion, useScroll, useTransform, useSpring, useMotionValue, useVelocity, useAnimationFrame, useReducedMotion } from "framer-motion";

/* Effects layer for the landing site: one custom cursor, smooth scroll zoom of sections and staggered reveals.
   Everything is a no-op under prefers-reduced-motion, and the cursor only exists on fine pointers. */

const finePointer = () => typeof window !== "undefined" && window.matchMedia?.("(hover:hover) and (pointer:fine)").matches;
const reducedMotion = () => typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

/* ───────── Cursor: one soft circle that follows the pointer and swells over anything clickable ───────── */
function Cursor() {
  const x = useMotionValue(-100), y = useMotionValue(-100);
  const sx = useSpring(x, { stiffness: 380, damping: 32, mass: 0.5 });
  const sy = useSpring(y, { stiffness: 380, damping: 32, mass: 0.5 });
  const [big, setBig] = useState(false);
  const [on, setOn] = useState(false);
  useEffect(() => {
    document.documentElement.classList.add("fx-nocursor");
    const move = (e) => {
      x.set(e.clientX); y.set(e.clientY); setOn(true);
      setBig(!!e.target.closest?.("a,button,[role=button],[role=radio],summary,select,label,input,textarea"));
    };
    const leave = () => setOn(false);
    window.addEventListener("pointermove", move, { passive: true });
    document.documentElement.addEventListener("mouseleave", leave);
    return () => { document.documentElement.classList.remove("fx-nocursor"); window.removeEventListener("pointermove", move); document.documentElement.removeEventListener("mouseleave", leave); };
  }, [x, y]);
  return <motion.div className={`fx-cur${big ? " is-big" : ""}${on ? " is-on" : ""}`} style={{ x: sx, y: sy }} aria-hidden="true" />;
}

/* ───────── Scroll zoom (small → large on the way in, a touch smaller on the way out), reveal on enter ───────── */
const REVEAL = ".nx-head h2,.nx-head>p,.nx-cta-band h2,.nx-cta-band p,.nx-about-copy p,.nx-cell,.nx-use,.nx-role,.nx-pillar,.nx-surface-list li,.nx-explore-grid button,.nx-faq-card,.nx-q,.nx-contact-row>*";

function useEffects(page) {
  useEffect(() => {
    if (reducedMotion()) return undefined;
    const cleanups = [];
    const main = document.querySelector(".nx-main");
    const secs = main ? [...main.children].filter((s) => s.tagName === "SECTION" && !/sc-hero|nx-hero|nx-faq|sc-demo/.test(s.className)) : [];
    const items = secs.map((s) => ({ el: s.firstElementChild, cur: 0, tgt: 0 })).filter((i) => i.el);
    let raf = 0;
    const measure = () => {
      const vh = innerHeight;
      for (const it of items) {
        const r = it.el.getBoundingClientRect();
        const enter = clamp((vh * 0.98 - r.top) / (vh * 0.7), 0, 1);       // 0 → 1 while it rises into view
        const exit = clamp(r.bottom / (vh * 0.5), 0, 1);                    // 1 → 0 as it leaves the top
        it.tgt = enter * (0.5 + 0.5 * exit);
        it.origin = r.top > vh * 0.3 ? "50% 0%" : "50% 100%";
      }
    };
    const frame = () => {
      raf = 0; let busy = false;
      for (const it of items) {
        it.cur += (it.tgt - it.cur) * 0.11;                                 // easing, so the zoom glides instead of tracking the wheel
        if (Math.abs(it.tgt - it.cur) > 0.0008) busy = true; else it.cur = it.tgt;
        const k = 1 - Math.pow(1 - it.cur, 3);
        it.el.style.transform = `scale(${(0.88 + 0.12 * k).toFixed(4)})`;
        it.el.style.opacity = (0.15 + 0.85 * k).toFixed(3);
        it.el.style.transformOrigin = it.origin;
      }
      if (busy) raf = requestAnimationFrame(frame);
    };
    const kick = () => { measure(); if (!raf) raf = requestAnimationFrame(frame); };
    items.forEach((it) => { it.el.style.willChange = "transform, opacity"; });
    window.addEventListener("scroll", kick, { passive: true }); window.addEventListener("resize", kick);
    measure(); items.forEach((it) => { it.cur = it.tgt; }); frame();
    cleanups.push(() => { window.removeEventListener("scroll", kick); window.removeEventListener("resize", kick); cancelAnimationFrame(raf); items.forEach((it) => { it.el.style.transform = ""; it.el.style.opacity = ""; it.el.style.willChange = ""; }); });

    const rev = main ? [...main.querySelectorAll(REVEAL)].filter((el) => !el.classList.contains("reveal") && !el.closest(".sc-hero")) : [];
    const vh0 = innerHeight;
    rev.forEach((el) => {
      const sib = el.parentElement ? [...el.parentElement.children].indexOf(el) : 0;
      el.style.setProperty("--i", String(sib % 6));
      if (el.getBoundingClientRect().top > vh0 * 0.92) el.classList.add("fx-pre");
    });
    const io = new IntersectionObserver((ents) => {
      for (const en of ents) {
        if (!en.isIntersecting) continue;
        io.unobserve(en.target);
        if (en.target.classList.contains("fx-pre")) { en.target.classList.remove("fx-pre"); en.target.classList.add("fx-in"); }
      }
    }, { threshold: 0.15, rootMargin: "0px 0px -6% 0px" });
    rev.forEach((el) => io.observe(el));
    cleanups.push(() => { io.disconnect(); rev.forEach((el) => el.classList.remove("fx-pre", "fx-in")); });
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
