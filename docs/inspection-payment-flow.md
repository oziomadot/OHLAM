# Inspection and payment app changes

Use this branch with the coordinated OPAAM backend branch. Both changes target `main`; do not use the older OHLAM `master` snapshot.

- Appointment details now show the active inspection workflow directly.
- Customers choose personal attendance or a registered/guest representative.
- Registered representatives open their invitations from the appointment dashboard or notification action. Guests use the revocable browser link shared by the customer.
- The attendee reviews the property/lister; the lister reviews the actual attendee and is redirected to beneficiary confirmation.
- Only customers can proceed or decline. Payment review shows missing details, confirmed beneficiary, checkout status and verified receipt.
- Bank details remain masked. Checkout is opened only for a backend-returned Paystack HTTPS URL. Closing the browser does not establish success.
- Mutation buttons use an immediate lock to suppress double taps. Every mutation reloads authoritative state after errors and does not retry automatically.

Run `npm ci`, then `node --test scripts/inspection-flow.test.cjs` (also available as `npm run test:inspection-flow`). These interaction tests use mocked native surfaces and the existing React test renderer. They are not a physical-device GPS test.

Run `npx tsc --noEmit`. The baseline project has 25 existing TypeScript diagnostics outside this change; the inspection/payment update introduces none. Do not interpret the full type check as passing.

Test the backend migration and queue/mail configuration first, then use a development or preview build pointing to that backend. Check personal inspection, registered and guest delegation, both report orders, missing and existing beneficiaries, customer decline and successful test payment. Do not charge live funds for staging tests. Merge/deploy the two PRs together after review and staging validation.

See `docs/inspection-payment-flow.md` in OPAAM for backend rollout commands, migration details, Paystack balance collection and the initialization reconciliation policy.
