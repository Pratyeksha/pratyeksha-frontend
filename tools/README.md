# Pratyeksha QR tools (v2)

Offline twin of **Master Admin → QR Studio**. Same signer as the backend (`tests/parity.test.mjs` pins it) and the same poster compositor.

```bash
npm install
# Online (recommended: real table list, signed by the server, no secret on your machine)
node generate-posters.mjs --tenant <tenantId> --api https://<backend-host> --master-key $MASTER_ADMIN_KEY
# Offline (needs the backend's TABLE_QR_SECRET)
TABLE_QR_SECRET=… node generate-posters.mjs --tenant <tenantId> --tables 12
```
Output: `Table_<n>.png`, `Counter.png` (label **CT**), `manifest.csv`. 2048×3070 px, 300 dpi metadata. `npm test` verifies signer parity and that each poster's QR decodes to the signed URL.
`generateQRs.js` is kept as a thin wrapper. The old script printed `tenant:table` full-hex signatures; the backend still **accepts** those already-printed codes (legacy `qr` parameter) but this tool no longer creates them.
Font: Roboto Condensed Bold (SIL OFL).
