Dev-only checks (not part of the build):

* `node scripts/render-smoke.mjs` — server-renders every new screen; needs nothing extra.
* `node scripts/recommend-check.mjs` — unit checks for the cart recommender; needs nothing extra.
* `node scripts/poster-check.mjs` — renders QR posters and decodes them back. Needs native packages that are deliberately NOT in package.json (they would slow/break Vercel installs):
  `npm i --no-save canvas jsqr` and a TTF copy of Roboto Condensed Bold (set `POSTER_FONT_TTF`, default `/tmp/RobotoCondensed-Bold.ttf`; `tools/assets/RobotoCondensed-Bold.ttf` works).
