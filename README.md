# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.


## Customer discovery page (CustomerHome) updates
- Place detail now has **Reserve a table / Join waitlist / Order pickup** buttons; the small service icons on each card are tappable and open the same flow (`/<tenant>?entry=home&service=reservation|waitlist|pickup`).
- **Sort** works together with **Near me** (distance is the tie-breaker).
- Offer pills/sheet show validity date, minimum bill and code. Share sends the restaurant's page on this platform plus the map link.
- Previously hard-coded English labels are translated for Marathi.
- The internal listing-audit panel (`?audit=1`) is now disabled in production builds; set `VITE_ENABLE_LISTING_AUDIT=true` at build time to enable it for staff.
