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

## Owner app: real Bklit UI + real Motion
* Recharts is gone from the Owner app. Every chart is now an actual Bklit UI component: the registry sources were resolved offline exactly as `shadcn add` would (area, line, bar, pie, sparkline, grid, axes, tooltip, legend + their internals) and vendored into `src/components/charts/` with `src/lib/utils.ts`. Thin wrappers in `src/ownerCharts.jsx` keep the old helper signatures, so the 14 chart call sites did not change.
* Charts: revenue trend = AreaChart, daily profit = LineChart, hourly revenue = BarSparkline with hover readout, rankings = horizontal BarChart with value labels, time-of-day/prep time = BarChart (the highlighted bar is a two-series stack, because Bklit's Bar has no per-bar colour), splits = PieChart donut whose centre swaps to the hovered slice.
* Real Motion (`motion` 14.12, `motion/react`) for the Owner app only: app-wide reduced-motion (`MotionConfig`), page transitions between modules, spring modals, shared-layout pill for the sidebar and tab pills (`layoutId`), spring toggles (`src/ownerMotion.jsx`).
* Build setup: `@` alias to `src/` and `@tailwindcss/vite` in `vite.config.js`. Tailwind 4 is loaded from `src/bklit.css` with utilities only (no preflight), scanning only the chart files, inside a cascade layer, so the app's own CSS is untouched. Chart colours are Bklit tokens scoped to `.bk-scope` and set to the Owner champagne/bronze palette.
* New dependencies: motion, d3-shape, d3-scale, d3-array, clsx, tailwind-merge, @number-flow/react, @base-ui/react (runtime); tailwindcss, @tailwindcss/vite (dev). `recharts` stays because the Operator portal still uses it.
