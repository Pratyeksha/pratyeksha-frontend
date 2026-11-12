/* Owner motion — the real Motion package (`motion/react`, v14), used for the Owner app only.
 * Principles from the Motion skill: transform/opacity only, springs for gestures, reduced-motion honoured globally,
 * entrances run once, nothing animates on every data refresh.
 */
import React from 'react';
import { MotionConfig, motion as Motion, AnimatePresence, useReducedMotion } from 'motion/react';

const EASE = [0.22, 1, 0.36, 1];

/** Wrap the Owner app once: every motion.* inside honours the OS reduce-motion setting. */
export function OwnerMotion({ children }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}

/** Page-level cross-fade/rise when the active module changes (key it by route). */
export function PageTransition({ pageKey, children }) {
  const reduce = useReducedMotion();
  return (
    <AnimatePresence mode="wait" initial={false}>
      <Motion.div key={pageKey}
        initial={reduce ? false : { opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={reduce ? { opacity: 0 } : { opacity: 0, y: -6 }}
        transition={{ duration: 0.22, ease: EASE }}>
        {children}
      </Motion.div>
    </AnimatePresence>
  );
}

/** Grid/list container + item pair: children rise in with a short stagger on first view. */
export function Stagger({ children, style, className, stagger = 0.045 }) {
  return (
    <Motion.div className={className} style={style} initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.12 }}
      variants={{ hidden: {}, show: { transition: { staggerChildren: stagger } } }}>
      {children}
    </Motion.div>
  );
}
export function StaggerItem({ children, style, className }) {
  return (
    <Motion.div className={className} style={style}
      variants={{ hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: EASE } } }}>
      {children}
    </Motion.div>
  );
}

/** Spring press feedback + lift on hover for interactive cards. */
export const InteractiveMotion = ({ children, style, className, onClick, ...rest }) => (
  <Motion.div className={className} style={style} onClick={onClick} whileHover={{ y: -2 }} whileTap={{ scale: 0.985 }}
    transition={{ type: 'spring', stiffness: 420, damping: 30 }} {...rest}>
    {children}
  </Motion.div>
);
