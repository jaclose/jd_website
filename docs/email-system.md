# Confirmed email subscriptions

Readers choose essays, field notes, and/or project updates. Sending the form
creates a short-lived request and emails a private confirmation link. It does
not subscribe a contact. The reader reviews the choices and confirms explicitly.
The same flow manages existing preferences and unsubscribes from all three kinds
of update. Every publication also carries Resend's native unsubscribe link.

## Configuration

Apply `supabase/migrations/20261011125729_newsletter_confirmations.sql` to the
intended Supabase database after reviewing it. It only adds the newsletter table,
indexes, and two server-only functions. Do not rerun older migrations blindly.
The site uses `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` on the server.
The public Supabase key cannot access newsletter records or execute the functions.

In Resend, verify the sending domain and sender address, then create three
**distinct segments** and three **distinct topics with default subscription
`opt_out`**. Verify each topic's setting in the dashboard before activation.
These are independent consent categories, not aliases of one audience:

| Category | Segment environment variable | Topic environment variable |
| --- | --- | --- |
| Essays | `SEGMENT_ESSAYS_ID` | `TOPIC_ESSAYS_ID` |
| Field notes | `SEGMENT_FIELDNOTES_ID` | `TOPIC_FIELDNOTES_ID` |
| Project updates | `SEGMENT_DEPLOYMENTS_ID` | `TOPIC_PROJECTS_ID` |

Also set `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, optional `RESEND_FROM_NAME`, and
`NEXT_PUBLIC_SITE_URL=https://www.jafardabbagh.com`. The API key needs contacts,
segments, topics, email, and broadcast permissions. No secret may use a
`NEXT_PUBLIC_` prefix. The retired `RESEND_TOPIC_ID` is not read.

Production credentials must not be copied into previews. Preview email is blocked
unless `NEWSLETTER_ALLOW_PREVIEW=true`; only enable this with isolated test
Resend segments/topics, a test database, and the preview's own site origin.
Missing configuration returns an honest unavailable state, never false success.

## State and privacy

- Database: email address, requested choices, intent, timestamps, SHA-256 token
  digest, and keyed IP hash. No raw token or raw IP is stored there.
- Credentials: 32 random bytes, 30-minute expiry, single use. The token arrives in
  the URL fragment, is removed immediately, and is posted in a no-cache body.
  Opening the page does not change subscription preferences.
- Rate limits: three requests per address and ten per connection per hour.
  Advisory locks enforce limits across concurrent serverless requests. Honeypots
  send no email. Records older than seven days are deleted on the next request.
- Consumption invalidates all outstanding sibling links. A failed provider write
  consumes the link too; the reader requests a new link and checks current state.
- Provider writes set all three topic choices before changing memberships, so a
  failed segment removal cannot override a topic opt-out. Multi-request provider
  writes are not a database transaction; failures are surfaced, not called success.
- Supabase is only the pending-request store. Resend owns subscriber contacts,
  topic consent, delivery records, provider-side suppression, and export.
- `GET` never subscribes or unsubscribes. Access is possession of a mailed token;
  there is no public address lookup. UI does not reveal the full email address.
- A globally suppressed contact is re-enabled only after a confirmed selection.
  Unsubscribe-all here opts out of the site's three topics and removes its three
  segment memberships; unrelated lists are not changed.

No existing contacts are automatically imported or opted into new topics.
Review legacy contacts and invite fresh confirmation only with appropriate
existing permission. Do not infer consent from old segment membership.

## Publishing one update

Use the manual `publication-email` GitHub Actions workflow on `main`. Configure
its `newsletter` environment with required reviewers and the Resend variables
above as environment secrets. Supabase secrets are not needed by broadcasts.
Choose one exact publication type and slug. Leave `send` false to create a draft.
Review its content and recipients in Resend, then run the same selection with
`send` true when explicitly authorized to email the list.

The workflow serializes dispatches and writes `data/email-dispatch-log.json` back
to main. Verify repository rules permit this bot update, or arrange an approved
log-commit path before sending. A failed log push must not prompt a manual resend:
provider-name recovery checks existing drafts and sent/queued broadcasts first.
Do not run concurrent local dispatch scripts; the workflow is the single sender.
The former broadcast API returns 410 to authenticated callers and does not send.

Local review commands (the first two never contact Resend):

```sh
npm run email:dispatch
DRY_RUN_EMAILS=true npm run email:dispatch -- --type=deployment --slug=axom
```

The dry run writes `/tmp/email-preview.html` and `/tmp/email-preview.txt`.
The inventory prints available slugs; it never sweeps the archive into drafts.
Without `DRY_RUN_EMAILS`, the same selected command creates/reuses a provider
draft. `--send` sends that reviewed draft; it does not silently update its content.
`--test-to=<address>` sends only to that address and requires explicit authorization.
Native unsubscribe tokens only resolve in real broadcasts; the single-address
preview path substitutes a placeholder link and cannot prove unsubscribe behavior.

If a draft needs editorial changes, edit it in Resend and review it there. Do not
use a new slug solely to bypass deduplication. Historical Noctyrium dispatch log
entries count as the same AXOM project publication, avoiding an accidental resend.

## Verification

```sh
npm ci
npm test
npm run lint
npm run build
npm run typecheck
npm run test:browser:newsletter
```

The browser script runs the built Next application, PGlite PostgreSQL, and a local
Resend HTTP simulator. It tests signup, confirmation, single-use replay,
preferences, unsubscribe, provider failure, and malformed input. It uses installed
Chrome by default; set `PLAYWRIGHT_BROWSER=chromium` after
`npx playwright-core install chromium` to use Playwright's browser. It sends no
real email and proves no provider DNS or inbox-delivery behavior.

Before production activation, use an authorized test recipient and verify actual
confirmation delivery, three category preferences, unsubscribe, expiry, provider
suppression, and a draft's topic/segment assignment. Inspect provider DNS status
(SPF/DKIM and the domain's DMARC), then send a test broadcast only with approval.
