# PRATYEKSHa Lead CRM — deployment checklist

## Preserved stack
- Backend: existing Express 5 + Mongoose/MongoDB application.
- Frontend: existing Vite + React 18 application.
- API root: existing `API_BASE_URL` (`/api` is already included).
- CRM collections are additive: `crm_leads`, `crm_lead_activities`, `crm_notifications`.

## Deploy
1. Back up the current backend and frontend repositories before replacing files.
2. Merge the ZIP contents into the matching existing repositories; do not replace repository roots with the ZIP's folder names.
3. Keep `crm-module.js` beside `server.js`; `server.js` registers it before the API 404 handler.
4. Keep `LeadCRM.jsx` and `LeadCRM.css` beside the existing frontend source components.
5. Install dependencies from the existing lockfiles (`npm ci`) and build the frontend (`npm run build`).
6. Configure `VITE_API_URL` in the frontend deployment to the backend API base URL ending in `/api`, if the existing default is not the intended production host.
7. Configure `MONGODB_URI` and the existing application environment variables in the backend host. Never upload a local `.env` file to Git or a deployment artifact.
8. For reminder emails, set `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS`, optional `SMTP_FROM`, and `CRM_REMINDER_EMAIL` on the backend host.
9. Deploy the backend first, verify its health endpoint and MongoDB connection, then deploy the frontend.
10. In Master Admin → Lead CRM, add a test lead, edit its status, schedule a future follow-up, record an activity, check onboarding, and delete the test record. Then import the workbook and verify a sample of imported rows before outreach.

## Important production security gate
The current PRATYEKSHa backend's existing admin login returns an opaque timestamp token and does not provide a verified server-side Master Admin authorization middleware. The additive CRM routes reuse the existing app/API setup and are **not independently authenticated by this integration**. Before exposing this CRM to the public internet or importing real contact data, put these routes behind a real server-verified Master Admin/team authentication and authorization layer. Do not treat a hidden frontend tab or a client-side flag as access control. This security limitation cannot safely be fixed by embedding a secret in the Vite frontend.

## Reminder behaviour
- In-app reminders work without SMTP.
- Email reminders go to the single configured `CRM_REMINDER_EMAIL` inbox; they are not individually routed to each assigned user.
- WhatsApp opens a prefilled message for a person to review and send; it does not send automatically.
- The scheduled reminder job runs every 15 minutes while the backend process is running. On multi-instance hosting, configure a single scheduler instance or a distributed lock before scaling to multiple backend replicas.

## Rollback
Keep the pre-deployment source backup. To roll back, restore the previous frontend/backend files; the additive CRM collections can remain in MongoDB without affecting existing restaurant modules.
