/* Motion tokens shared by motionKit.jsx and callers (kept out of the component file for fast-refresh). */
export const EASE_OUT = [0.22, 1, 0.36, 1];
export const EASE_IN_OUT = [0.85, 0, 0.15, 1];
export const SPRING_SNAPPY = { type: 'spring', stiffness: 420, damping: 30, mass: 0.7 };
export const SPRING_SOFT = { type: 'spring', stiffness: 220, damping: 26, mass: 0.9 };
/** Shared press feedback for tappable cards/buttons. */
export const press = { whileTap: { scale: 0.96 }, transition: SPRING_SNAPPY };
