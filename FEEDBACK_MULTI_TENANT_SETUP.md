# Feedback Suite tenant URL and Vercel setup

No feedback screens or visual styling were changed for tenant support. The embedded Feedback Suite reads `tenantId` from its URL query string and automatically attaches it to API calls.

- Customer QR: `/feedback-suite/?tenantId=YOUR_TENANT_ID`
- Admin login: `/feedback-suite/admin/login?tenantId=YOUR_TENANT_ID`
- Campaign Studio: `/feedback-suite/campaigns?tenantId=YOUR_TENANT_ID`

Set the Vercel production environment variable `VITE_FEEDBACK_API_URL` to `https://YOUR_RENDER_HOST/api/feedback-suite`. Keep `VITE_API_URL` pointed to the existing Render API as described in the main deployment guide. Redeploy Vercel after changing environment variables.

A tenant can use Feedback Suite only when the matching `tenants` document has `config.products.feedbackSuite: true` and its subscription is not expired. WhatsApp Campaign Studio additionally requires `config.products.whatsappCampaigns: true`. Per-tenant admin email/password hashes and campaign password hashes are configured by the platform operator in the tenant record; see the backend's `FEEDBACK_MULTI_TENANT_DEPLOYMENT.md`.

Always test at least two tenants before production. Tenant A's feedback, customers, exports, settings and campaigns must never be visible to Tenant B. QR links must include the right tenant ID. Existing data from a previous separate database needs an explicit migration; this frontend change does not move historical records.

Master Admin onboarding and renewal now include product entitlement selection. When enabling Feedback Suite for an existing tenant, provide that tenant's Feedback Admin email and password if not already configured; when enabling WhatsApp Campaigns, configure a separate Campaign Studio password. The API returns only whether a password is configured, never the hashes themselves.
