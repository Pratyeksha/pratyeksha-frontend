Operator portal overlay. Copy src/*, CHANGES.md over your project (same paths).
Prerequisite: the owner-premium-overlay files (src/components/charts, src/lib/utils.ts, bklit.css deps, vite.config.js,
jsconfig.json, package.json deps) must already be in place - the Operator portal reuses them.
No new npm packages. `recharts` is no longer imported anywhere and can be removed from package.json if you wish.
