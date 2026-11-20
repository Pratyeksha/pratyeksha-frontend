/* Floating "Ask" button for the home screen. Deliberately tiny (CSS-only orb) because it ships with the home page;
 * the chat itself (engine, artwork, styles) is a separate chunk fetched on first hover/tap or when the browser is idle. */
import React from 'react';
import { motion } from 'framer-motion';
import './chatLauncher.css';

export default function ChatLauncher({ label, lifted, onOpen, onWarm }) {
  return (
    <motion.button
      type="button" className={`pxl-fab${lifted ? ' lifted' : ''}`} onClick={onOpen} onPointerEnter={onWarm} onFocus={onWarm} onTouchStart={onWarm} aria-label={label}
      initial={{ opacity: 0, y: 24, scale: 0.8 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ delay: 1.1, type: 'spring', stiffness: 220, damping: 18 }} whileTap={{ scale: 0.94 }}
    >
      <span className="pxl-orb" aria-hidden="true"><i /><b /></span>
      <span className="pxl-label">{label}</span>
    </motion.button>
  );
}
