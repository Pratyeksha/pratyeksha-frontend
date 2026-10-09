# Feedback Suite frontend integration

- Public feedback entry: `/feedback-suite/`
- Direct links: `/feedback-suite/feedback`, `/feedback-suite/admin/login`, `/feedback-suite/admin`, `/feedback-suite/campaigns`, `/feedback-suite/documents`.
- The original client source and CSS are isolated in `feedback-suite-app/`; it is built into `dist/feedback-suite-app/`.
- Build command remains `npm run build`; it builds the original PRATYEKSHa app and then the feedback sub-app.
- Set `VITE_FEEDBACK_API_URL` at build time to `https://pratyeksha-backend.onrender.com/api/feedback-suite`. This uses the existing PRATYEKSHa Render backend; do not create a second backend service for Feedback Suite.
- Feedback PWA assets and service worker are scoped under `/feedback-suite-app/` to avoid replacing the main PRATYEKSHa service worker.
