# Two-factor sign-in (every login)

Every sign-in needs a **password and a 6-digit code from an authenticator app** (Google Authenticator, Microsoft Authenticator, Authy, 1Password...). Covered: platform admin (owner password and every team member), restaurant operator / kitchen screen, restaurant owner app (including the first-time setup), Feedback Suite admin.

## What people see
1. They sign in with their password as before.
2. **First time:** a QR code appears. They scan it, type the 6-digit code, and are shown **10 recovery codes** (shown once; each works once). Then they are signed in.
3. **After that:** they type the 6-digit code from the app each time they sign in (or one recovery code).
4. 5 wrong codes in 10 minutes lock that account's code step for 15 minutes.

## Lost phone
* A platform **owner** opens *Team & access* and uses **Reset two-factor** (or `POST /api/admin/master/team/2fa/reset { kind, subject }`). The person enrols a new phone at their next sign-in.
* If the platform owner themselves is locked out: `npm run reset-2fa -- master owner` on the server (needs `MONGO_URI`).

## Environment
| Variable | Meaning |
|---|---|
| `TWO_FACTOR_ENFORCE` | `true` (default) = mandatory for every login. `false` = only accounts that already enrolled are challenged. |
| `TWO_FACTOR_KEY` | Secret used to encrypt stored authenticator secrets. Falls back to `MASTER_JWT_SECRET` / `OWNER_JWT_SECRET` / `JWT_SECRET`. **Keep it stable**: changing it makes existing enrolments unreadable (everyone would need a reset). |
| `TWO_FACTOR_ISSUER` | Name shown in the authenticator app (default `Pratyeksha`). |

## Rollout note
With enforcement on, **every existing account enrols at its next sign-in**, including kitchen tablets that are signed in with the operator login: whoever signs in needs an authenticator. Sessions already issued keep working until they expire (operator and owner tokens last 30 days), so the change reaches people gradually. Platform team members who had enabled the old 2FA keep their authenticator (it is adopted automatically).

## How it is built
`src/security/two-factor.js` (TOTP RFC 6238, no extra package) + one `gate()` call in each login route. The password step returns a signed 10-minute **challenge token** (not a session); the session is created only by a finisher after the code is accepted. Routes: `POST /api/auth/2fa/verify | setup | enable`. A code works once (atomic compare-and-set on the matched 30-second step); secrets are AES-256-GCM encrypted at rest; recovery codes are stored only as keyed hashes. Tests: `npm run test:2fa` (no database needed).
