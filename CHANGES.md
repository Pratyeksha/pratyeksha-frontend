# Frontend changes in this release
Master Admin → QR Studio (template posters, ZIP download, server-verified) · QR gate + premium error screen · operator Tables / Combos / Bill Requests
panels · customer combos, approved-bill view (live status), cart-aware recommendations, ETA fixes · directory offer filters + offer sheet + relevance-ranked
search · UPI logos, transaction reference, in-app help for declined payments · branded scrollbars (`brand-scrollbar.css`) · Live Kitchen "Secure QR" removed
(release-lock moved to Operator → Tables).
Dev checks: `node scripts/render-smoke.mjs`, `node scripts/recommend-check.mjs` (see scripts/README.md).

## Tools merged in
The former standalone `tools` package now lives in `tools/` (own package.json; run `cd tools && npm install`). Offline twin of QR Studio: `node generate-posters.mjs --tenant <id> --api <backend> --master-key $MASTER_ADMIN_KEY`.
