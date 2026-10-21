# Manual UPI workflow UI integration (source update)

## Included
- Master Admin navigation entry `UPI Payments` with platform UPI ID, payee name, instructions, monthly plan pricing, queue filters, UTR display, verify/reject actions, and a verifier audit name. The Master Admin key is entered by an authorized operator at runtime and is not compiled into frontend environment variables.
- Customer bill view retains the existing itemized invoice and PDF download and now exposes server-generated UPI payment intents per persisted order, Google Pay/PhonePe launch actions, UTR submission, and pending-state messaging. Payment amounts and UPI destination are returned by the backend, not calculated in the payment UI.
- Backend status polling, pre-UTR cancellation, and audited external-refund recording endpoints. Refund recording explicitly does not claim to issue a bank refund or automatically reverse subscription/revenue accounting.

## Important deployment and validation notes
- UTR submission is never proof of payment. A Master Admin must independently reconcile the UTR and amount against the receiving account before verification.
- Existing customer bill amounts can aggregate multiple order records. This UI intentionally creates one payment intent per persisted order ID; orders without server-issued IDs cannot be paid through this workflow. Verify that the restaurant’s operator settlement process marks the same order records paid.
- The existing app's QR/session implementation must be server-authoritative before a hard menu lock can be considered a security boundary. A client-side sessionStorage marker alone is not authorization and is not represented as such here. Existing session/order endpoints still require a full integration test against a valid signed QR session.
- `MASTER_ADMIN_PAYMENT_KEY` must be a random server-only secret of at least 32 characters. This key-based guard is a separate gate for payment routes; never bake the key into the frontend or use a public shared value. Existing platform admin routes should be protected by the app's existing admin authorization before production.
- MongoDB transaction support (replica set) is required by the existing verify + subscription extension transaction. Index creation must be checked against production data before rollout.
- This is not certified production-ready: no live database, Google Pay/PhonePe device test, duplicate-UTR race test, concurrent verification test, end-to-end customer/operator reconciliation test, or production build has yet been run.
