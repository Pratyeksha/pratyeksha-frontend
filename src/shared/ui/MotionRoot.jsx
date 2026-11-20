import { MotionConfig } from 'framer-motion';

/** App-wide wrapper: honours the OS "reduce motion" setting for every motion.* element in the tree.
 *  Lives in its own file so main.jsx does not pull the whole motionKit (and its animation helpers) into the entry bundle. */
export function MotionRoot({ children }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
export default MotionRoot;
