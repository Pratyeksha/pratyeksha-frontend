# Frontend changes in this release
Master Admin → QR Studio (template posters, ZIP download, server-verified) · QR gate + premium error screen · operator Tables / Combos / Bill Requests
panels · customer combos, approved-bill view (live status), cart-aware recommendations, ETA fixes · directory offer filters + offer sheet + relevance-ranked
search · UPI logos, transaction reference, in-app help for declined payments · branded scrollbars (`brand-scrollbar.css`) · Live Kitchen "Secure QR" removed
(release-lock moved to Operator → Tables).
Dev checks: `node scripts/render-smoke.mjs`, `node scripts/recommend-check.mjs` (see scripts/README.md).

## Tools merged in
The former standalone `tools` package now lives in `tools/` (own package.json; run `cd tools && npm install`). Offline twin of QR Studio: `node generate-posters.mjs --tenant <id> --api <backend> --master-key $MASTER_ADMIN_KEY`.

## Premium UI/UX pass (Bklit UI + Motion patterns)
New shared layer: `src/motionKit.jsx` + `src/motionTokens.js` (Reveal, Stagger, AnimatedNumber, ScrollProgress, MotionRoot), `src/chartKit.jsx` + `src/chartKit.css` (AreaChart, BarChart, Sparkline, RingGauge, DonutRing, TimelineStrip, ChartLegend - dependency-free SVG, token-themed) and `src/premium-polish.css` (focus, tap, selection, landing chart tokens).
* App-wide: `MotionRoot` (`MotionConfig reducedMotion="user"`) now honours the OS reduce-motion setting for every existing `motion.*` element.
* Landing (`/landing`): scroll-progress line, floating sample sales-pulse card in the hero, count-up metrics, interactive bar chart (hover/keyboard tooltip) replacing the CSS-only bars, sparklines + occupancy ring in the operator board. All figures are labelled as sample data.
* Customer Home (`/`): animated live-count, press feedback on filter chips, "Around you right now" card (open-now ring + cafe/dine split, real directory data), 24h opening-hours strip with a now marker in the place sheet.
* Menu app (`/:tenant`): order-tracker ring showing live preparation progress next to the ETA.
Money amounts, bills and invoices are deliberately NOT animated. No new npm dependencies (framer-motion ^11 already installed).
