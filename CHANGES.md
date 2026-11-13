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

## Owner app: Alerts redesign, more graphics, mobile pass
* Alerts tab rebuilt (`src/OwnerAlerts.jsx`): one inbox for stock/revenue/kitchen alerts and platform notices; severity summary tiles that double as filters; source tabs, category chips and an unread-only toggle in a sticky, horizontally scrollable rail; collapsible insights (severity donut, last-7-days bars, top-category bars - all derived from the real alerts); day-grouped feed with NEW badges; optimistic mark-read, "Mark all read", and swipe-right-to-mark-read on touch. Mark-all now refetches once instead of once per item.
* New visuals from existing data, using real Bklit components (Gauge, RingChart, AreaSparkline, Pie): Dashboard (break-even gauge, table-status rings, food-cost gauge), Revenue (month-target gauge, outlook bars), P&L (where each rupee goes donut, gross and net margin gauges), Customers (returning and at-risk gauges), Compliance (GST split donut, composition-limit gauge), Insights (stock-health and loyalty gauges).
* Mobile: grids can no longer overflow 320px screens (`minmax(min(100%, Npx), 1fr)`), cards and grid children may shrink, media never exceeds its card, horizontal overflow is clipped, modals become bottom sheets on phones, 44px touch targets in Alerts.

## Owner app: Kitchen redesign, chart overlap fixes, editor path config
* Kitchen performance rebuilt (`src/OwnerKitchen.jsx`): one command card (Bklit gauge + four target-checked metrics + trend chips, replacing the score card and four KPI tiles); Live tickets as compact tiles (SLA ring per ticket, dish-progress segments, oldest first, on-time/watch/late split bar, All/Late/Ready filters, "Show all N" beyond 8); prep-time trend next to slowest dishes as inline bars (replacing the chart plus duplicate table); 86'd items as chips. Two-up tiles at phone width.
* Overlap fixes: Bklit's Gauge sizes itself from its width (21:16, 300px default minimum), so the fixed-height box I wrapped it in let it spill over card headings and hint text - the wrapper now caps width only and the dial may shrink. Ring and donut centre text now shrinks/ellipsises to fit the hole; horizontal bars measure their card and the longest value so the name column and value gutter never collide.
* `jsconfig.json` maps `@/*` to `src/*` so editors resolve `import { cn } from "@/lib/utils"` (Vite already resolved it through the alias in `vite.config.js`); three vendored files carry `// @ts-nocheck` to keep editor type noise at zero.

## Operator portal: real Bklit + real Motion, more graphics, phone layout
* Recharts is gone from the Operator portal too (the whole app no longer needs it). Insights analytics now use Bklit: daily revenue area, orders-by-hour bars, revenue-by-weekday bars, all with hover/keyboard tooltips.
* New visuals from data the tabs already load, in the portal's brass palette (`.bk-scope-op`, no red/green/blue/orange): Insights (loyalty gauge, payment-mix donut, "where each rupee goes" donut in P&L), Customers (guest-segment donut, loyal and at-risk gauges), Day close (payment-mix donut above the bars), Inventory (stock-health gauge and stock-status donut).
* Motion: the portal now imports the real `motion` package (`motion/react`, same API as framer-motion, so its 110 existing animations are unchanged) and is wrapped in `MotionConfig reducedMotion="user"`.
* Phones: every `minmax(NNNpx, 1fr)` grid of 240px or more is now `minmax(min(100%, NNNpx), 1fr)` so nothing overflows a 320px screen; the GST/P&L pair stacks; fixed 3/4/5/6-column inline grids (floor-plan tables, KPI rows) reflow to fit using selectors that match how React actually serialises inline styles (the old attribute selectors expected no space after commas and never matched).
