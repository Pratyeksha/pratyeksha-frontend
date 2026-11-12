/* Motion kit — shared animation primitives (framer-motion v11, same API as `motion/react`).
 * Rules applied from the Motion skill notes:
 *  - animate transform/opacity only; springs for gestures, tweens for fades
 *  - every primitive respects prefers-reduced-motion (MotionRoot + per-hook checks)
 *  - viewport reveals run once; nothing animates layout properties
 */
import React, { useEffect, useRef } from 'react';
import {
  MotionConfig, motion, useReducedMotion, useInView, useMotionValue,
  useSpring, useScroll, useTransform, animate,
} from 'framer-motion';

import { EASE_OUT } from './motionTokens.js';

/** App-wide wrapper: honours the OS "reduce motion" setting for every motion.* element in the tree. */
export function MotionRoot({ children }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}

/** Fade + rise when scrolled into view (once). */
export function Reveal({ children, delay = 0, y = 16, duration = 0.6, className, style, as = 'div', amount = 0.2 }) {
  const reduce = useReducedMotion();
  const Tag = motion[as] || motion.div;
  return (
    <Tag
      className={className}
      style={style}
      initial={reduce ? false : { opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount, margin: '0px 0px -8% 0px' }}
      transition={{ duration, delay, ease: EASE_OUT }}
    >
      {children}
    </Tag>
  );
}

/** Parent + item pair for staggered lists. */
const listVariants = (stagger, delayChildren) => ({
  hidden: {},
  show: { transition: { staggerChildren: stagger, delayChildren } },
});
const itemVariants = (y) => ({
  hidden: { opacity: 0, y },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: EASE_OUT } },
});
export function Stagger({ children, stagger = 0.06, delayChildren = 0, className, style, as = 'div', amount = 0.15 }) {
  const reduce = useReducedMotion();
  const Tag = motion[as] || motion.div;
  return (
    <Tag className={className} style={style} variants={listVariants(stagger, delayChildren)}
      initial={reduce ? 'show' : 'hidden'} whileInView="show" viewport={{ once: true, amount }}>
      {children}
    </Tag>
  );
}
export function StaggerItem({ children, y = 14, className, style, as = 'div' }) {
  const Tag = motion[as] || motion.div;
  return <Tag className={className} style={style} variants={itemVariants(y)}>{children}</Tag>;
}

/** Number that eases to its value. Starts when visible; honours reduced motion. */
export function AnimatedNumber({ value, format, duration = 1.1, className, style, prefix = '', suffix = '' }) {
  const ref = useRef(null);
  const reduce = useReducedMotion();
  const inView = useInView(ref, { once: true, amount: 0.4 });
  const mv = useMotionValue(0);
  const fmt = format || ((n) => Math.round(n).toLocaleString('en-IN'));
  useEffect(() => {
    const node = ref.current;
    if (!node) return undefined;
    const write = (n) => { node.textContent = `${prefix}${fmt(n)}${suffix}`; };
    if (reduce) { write(Number(value) || 0); return undefined; }
    if (!inView) { write(0); return undefined; }
    const controls = animate(mv, Number(value) || 0, { duration, ease: EASE_OUT, onUpdate: write });
    return () => controls.stop();
    // fmt is stable enough for display purposes; re-run only when the target changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, inView, reduce, duration, prefix, suffix]);
  return <span ref={ref} className={className} style={style} aria-label={`${prefix}${fmt(Number(value) || 0)}${suffix}`}>{`${prefix}${fmt(reduce ? Number(value) || 0 : 0)}${suffix}`}</span>;
}

/** Thin scroll-progress line pinned to the top of the viewport. */
export function ScrollProgress({ color = 'linear-gradient(90deg,#d3bfa2,#f1e3c6)', height = 2, zIndex = 9000 }) {
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 140, damping: 28, mass: 0.4 });
  if (reduce) return null;
  return (
    <motion.div aria-hidden="true" style={{
      position: 'fixed', top: 0, left: 0, right: 0, height, zIndex, transformOrigin: '0 50%',
      scaleX, background: color, pointerEvents: 'none',
    }} />
  );
}

/** Gentle scroll-linked drift for decorative layers (transform only). */
export function Parallax({ children, distance = 40, className, style }) {
  const reduce = useReducedMotion();
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });
  const y = useTransform(scrollYProgress, [0, 1], [distance, -distance]);
  return <motion.div ref={ref} className={className} style={reduce ? style : { ...style, y }}>{children}</motion.div>;
}

