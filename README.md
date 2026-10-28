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


## Bill payment (UPI) & strict session (added)
- Owner app ▸ Settings ▸ **Online Payments (UPI) & Bank Details**: UPI ID, name shown to customers, optional bank details.
- After "Generate bill" the receipt page shows Google Pay / PhonePe / Paytm / BHIM / Other UPI buttons. Android uses `intent://pay?...;package=<app>` links, iOS uses `gpay://`, `phonepe://`, `paytmmp://`; desktop shows a QR code. The amount is the bill's grand total (same formula as the invoice PDF).
- Once the bill is generated the menu is closed: closing the receipt, refresh, back and forward all show the "session ended" screen. An unpaid bill can still be paid from that screen for 6 hours. Only scanning the table QR again starts a new session.


## Updates in this version
- **Master Admin > QR Studio**: signed, print-ready QR cards per table + counter (`CT`) on your template. The template is auto-detected, so replacing `public/qr-template.png` (or uploading another in the studio) needs no code change.
- **Invalid QR screen**: any edited or unsigned table link shows a premium "can't be verified" screen; the menu loads only after the backend verifies the scan.
- **Billing**: Generate bill creates a persistent request; the guest sees a waiting screen until the operator approves, then the exact approved bill (offers, discount, GST) with UPI payment and a PDF. Operator: floating "Bills" panel > Review & send.
- **Combos**: Operator > Marketing > Combos; shown to guests as a "Combos" menu category.
- **Tables**: operator floor map has +/- to add or remove tables (live on every device).
- **Customer Home**: search shows restaurants serving a dish/category, "Did you mean", voice search; offers have filters and a detail view.
- **UPI**: Google Pay / PhonePe / Paytm buttons with their marks; guests report a failed payment and the real reason reaches the operator.
- Gold scrollbar theme on all staff screens (customer screens keep hidden scrollbars).
