# PRATYEKSHa Lead CRM — additive integration

This CRM was added to the existing Express + MongoDB backend and Vite + React frontend. Existing restaurant/customer/order modules and their files were not intentionally refactored. The new frontend is available in Master Admin as **Lead CRM**.

## Included
- Lead create, edit, delete, search, pipeline-stage updates and owner assignment.
- Activity timeline for calls, WhatsApp, email, meetings, notes and scheduled follow-ups.
- Click-to-WhatsApp with a prefilled PRATYEKSHa introduction.
- Onboarding checklist and a go-live stage action.
- Excel/CSV import with duplicate matching on business name + area.
- In-app reminder inbox and 15-minute backend reminder job.
- Optional SMTP email reminders to the configured CRM reminder recipient.

## Deploy
1. Deploy the backend ZIP contents to the existing backend repository/host. Keep `crm-module.js` next to `server.js`.
2. Deploy the frontend ZIP contents to the existing frontend repository/host. `LeadCRM.jsx` is imported by the Master Admin screen.
3. Keep the existing environment variables and database unchanged. The new CRM uses the same MongoDB connection and existing `API_BASE_URL`.
4. For email reminders, add these variables to the backend host's environment (never commit real credentials):
   - `SMTP_HOST` — SMTP server hostname
   - `SMTP_PORT` — typically `587` (or `465` if secure)
   - `SMTP_SECURE` — `true` for port 465, otherwise `false`
   - `SMTP_USER` and `SMTP_PASS` — SMTP credentials
   - `SMTP_FROM` — optional sender address; defaults to `SMTP_USER`
   - `CRM_REMINDER_EMAIL` — inbox that receives team reminder emails
5. Redeploy backend after setting variables. In-app reminders work without SMTP; email delivery requires valid SMTP credentials and a recipient.

## Import the 542-lead tracker
Open Master Admin → Lead CRM → Import Excel and select `public/PRATYEKSHa_Kolhapur_Lead_CRM_Onboarding_System.xlsx` (also included at the frontend public root). The importer selects the `MASTER - ALL` worksheet when available. It imports business, phone, contact/decision maker, area, category, source, priority, sales stage, follow-up date and notes. Existing matching leads are updated instead of duplicated. Review the imported records before outreach because source verification fields in the tracker may indicate that contact details still need confirmation.

## Important integration notes
- The current application’s Master Admin access model is reused; this change does not add a new authentication provider or user-management system. `Assigned to` is an ownership/work-queue field, not an independent login.
- Set the recipient email for the team in `CRM_REMINDER_EMAIL`; this implementation sends due reminders to that configured inbox, not to every assigned person individually.
- No WhatsApp messages are sent automatically. The WhatsApp action opens a prefilled message for a human to review and send.
- The backend's existing JSON body limit is 2 MB. The included tracker should fit; if a different larger file exceeds the limit, split it into smaller imports.
