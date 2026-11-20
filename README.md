# Pratyeksha — Frontend

React 18 + Vite single-page app for the Pratyeksha café/restaurant platform
(guest ordering, owner app, operator portal, kitchen display, master admin, discovery, feedback suite).

## Quick start
```bash
npm ci
npm run dev        # local dev server
npm run build      # main app + feedback-suite-app  -> dist/
npm run lint
```
Copy `.env.example` to `.env` and fill in values. Deploy config: `vercel.json`.

## Layout
```
src/
  main.jsx              entry; lazy-loads each portal
  index.css             global styles
  features/             one folder per product area
    auth/  feedback/  guest/  kitchen/  landing/  master/  operator/  owner/
  shared/
    analytics/  lib/  ui/   code reused across features (ui/bklit.css = chart utilities)
  components/ lib/      vendored shadcn/Bklit chart code, resolved via the "@" alias
  assets/               images
  archive/              unreferenced legacy files kept for reference (not bundled)
feedback-suite-app/     separate Vite app, built by `npm run build`
scripts/                checks (recommend, poster, render-smoke)
tools/                  QR / poster generators and tests
public/                 static files
docs/                   CHANGES.md, SECURITY.md, archive/ (old READMEs, applied patches)
```
The `@` alias points to `src/`. `src/shared/ui/bklit.css` has `@source` paths that must be
kept in sync if chart components move.
