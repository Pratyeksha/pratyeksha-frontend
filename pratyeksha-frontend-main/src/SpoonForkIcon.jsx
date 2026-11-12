import React from 'react';

/**
 * Pratyeksha crossed spoon & fork — replaces the generic bell on every notification surface.
 * Drawn with a CSS mask so it takes any colour like a lucide icon: <SpoonForkIcon size={16} color="#d3bfa2" />
 */
export default function SpoonForkIcon({ size = 16, color = 'currentColor', style, className, ...rest }) {
  const s = typeof size === 'number' ? `${size}px` : size;
  const mask = "url('/spoonfork-mask.png') center / contain no-repeat";
  return (
    <span
      role="img"
      aria-label="Pratyeksha"
      className={className}
      style={{
        display: 'inline-block', flexShrink: 0, width: s, height: s,
        backgroundColor: color, WebkitMask: mask, mask,
        ...style,
      }}
      {...Object.fromEntries(Object.entries(rest).filter(([k]) => k.startsWith('data-') || k.startsWith('aria-')))}
    />
  );
}
