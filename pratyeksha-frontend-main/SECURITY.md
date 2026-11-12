# Frontend security notes

The full audit is in the backend project: `SECURITY_AND_PERFORMANCE_AUDIT.md`. Frontend-specific points:

## Content-Security-Policy (`vercel.json`)

The policy was built from the code and checked against the real production build (no inline scripts, every external script, style, font and
media host allowed). What it allows, and why:

| Directive | Allows | Because |
|---|---|---|
| `script-src` | `'self'`, `ajax.googleapis.com`, `www.gstatic.com`, `cdnjs.cloudflare.com`, `www.googletagmanager.com`, `'wasm-unsafe-eval'` | the app bundle; the 3D model viewer and its decoders; html2pdf in the invoice page; optional Google Analytics. **No `'unsafe-inline'`, no `'unsafe-eval'`.** |
| `style-src` | `'self'`, `'unsafe-inline'`, `fonts.googleapis.com` | React inline `style` attributes and the splash screen need inline styles |
| `font-src` | `'self'`, `data:`, `fonts.gstatic.com` | Google Fonts |
| `img-src`, `media-src` | `'self'`, `data:`, `blob:`, `https:` | dish photos and logos come from any HTTPS host; QR codes; kitchen alert sounds |
| `connect-src` | `'self'`, `https:`, `wss:`, `blob:`, `data:` | the API and Socket.IO host (set at build time, so not pinned), 3D models, analytics |
| `frame-src` | `'self'`, `www.google.com`, `maps.google.com` | the feedback suite (same origin) and Google Maps embeds |
| `worker-src` | `'self'`, `blob:` | service workers and the viewer's decoder workers |
| `object-src 'none'`, `base-uri`, `form-action`, `frame-ancestors` | `'none'` / `'self'` | no plugins, no base-tag or form hijacking, no framing by other sites |

To get the most out of it later: pin `connect-src` to your real API origin instead of `https:`.

Changes made so the policy could be strict: the inline splash-screen script moved to `public/splash.js`, and the invoice PDF trigger moved
out of an inline script in the generated invoice page into `src/invoicePdf.js`.

**Violation reports** go to `POST /api/csp-report` on the backend and appear in the server log as `[csp] violation: ...`. If something is
ever blocked in production, that line names the directive and the blocked URL.

**Roll back instantly**: in `vercel.json` rename the header key `Content-Security-Policy` to `Content-Security-Policy-Report-Only`
(the browser then only reports, never blocks). It was not possible to test in a real browser during the audit, which is why the report
endpoint exists. After deploying, open the kitchen, operator portal, a guest menu with a 3D dish, and an invoice PDF, and check the
browser console for "Content Security Policy" messages.

## Other headers

`X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `X-Frame-Options: SAMEORIGIN`.

## Sessions

`/master-admin` asks for the platform-admin password (token kept 12 h in `localStorage`); the operator portal and kitchen keep their signed
token under `pratyeksha_token` / `pratyeksha_kitchen_token`. Tokens are only ever sent to your own API (`src/masterAuth.js`, `src/operatorAuth.js`).

## Dependencies

What gets bundled into the site (`npm audit --omit=dev`): 3 advisories, none reachable here. `react-router` / `react-router-dom` (an open
redirect that needs a user-controlled navigation target, and a server-rendering issue; this app is a client-side SPA and every navigation
target is a fixed path; the fix is a major upgrade to v7) and `xlsx` (no fixed version exists on npm; the app writes spreadsheets with it
and reads only one: the platform-admin lead import).

The full `npm audit` also lists Vite and esbuild (they only run the development server on your machine; production is a static build) and
`minimatch` (a denial-of-service advisory published during the audit, no fixed version yet, in development tooling). Upgrade Vite and
react-router when convenient, testing the build, and re-run `npm audit` every few weeks.
