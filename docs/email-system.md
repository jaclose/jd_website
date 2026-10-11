# Letters from JD-1184

The site implements confirmed opt-in for new essays, field notes, project updates,
weekly roundups, and monthly roundups. Every choice is independent and optional.
A submitted form only sends a verification link; the reader must open it, review
the choices, and confirm. The same flow manages existing preferences and opt-out.

## Resend setup

1. In **Domains**, add or inspect `jafardabbagh.com`. Copy the exact DNS records
   shown by Resend into the domain's DNS provider and wait for **Verified**.
   Existing public SPF/DKIM records are not proof of the account's verified status.
   Use `notes@jafardabbagh.com` as the sender once verified. A reply mailbox is a
   separate mail-hosting setup; Resend sending does not create an inbox.
2. In **Audience → Segments**, create one segment named **JD-1184 Letters**.
   Save its ID as `SEGMENT_NEWSLETTER_ID`.
3. In **Audience → Topics**, create the five topics below. Each must have default
   subscription **Opt-out** and visibility **Public**. Resend's terminology means
   Opt-out-by-default requires an explicit subscription. Its default cannot be
   changed after creation, so verify it before saving.
4. Create a server API key with **Full access** (contact, topic, segment, email and
   broadcast operations are needed; Sending access alone is insufficient). Store
   it as `RESEND_API_KEY` in the hosting settings, never in a browser or repository.
5. Set up the sender/unsubscribe-page branding in Resend. Review the account's
   sending approval, Broadcast availability, marketing-contact allowance and
   sending quota before activation; this implementation does not buy a plan.

| Topic | Topic ID variable | Delivery |
| --- | --- | --- |
| Essays | `TOPIC_ESSAYS_ID` | Each new published essay |
| Field notes | `TOPIC_FIELDNOTES_ID` | Each new published field note |
| Project updates | `TOPIC_PROJECTS_ID` | Explicit new project announcements |
| Weekly letters | `TOPIC_WEEKLY_ID` | Sunday's roundup, due 09:00 Grenada time |
| Monthly letters | `TOPIC_MONTHLY_ID` | Previous month's roundup, due the 1st at 09:00 Grenada time |

All confirmed site subscribers remain members of the one audience. Topics are the
consent authority; broadcasts always specify the audience AND the correct topic.
This is deliberate: Resend's native preference page changes topics, not segment
memberships. Retaining audience membership after opt-out lets native preference
changes work without a syncing webhook. Opting out of all five topics stops all
site letters; provider global suppression also applies. No contact is enrolled in
a new topic by this deployment. Readers who choose alerts and a roundup receive
both; choosing only a cadence provides a quieter inbox.

**Upgrade from the earlier three-segment draft:** use the new common segment.
Do not simply reuse three category IDs. If that draft was previously activated,
add only its already-confirmed site contacts to the common segment, preserve every
existing topic/global opt-out, and leave both new cadence topics opted out. Do not
import unrelated account contacts or infer consent from old group membership.

Official references: [Domains](https://resend.com/docs/dashboard/domains/introduction),
[Topics](https://resend.com/docs/dashboard/contacts/manage-topics),
[API keys](https://resend.com/docs/dashboard/api-keys/introduction).

## Vercel and database configuration

For the `jd-website` project's **Production** environment, configure:

- `RESEND_API_KEY`, `RESEND_FROM_EMAIL=notes@jafardabbagh.com`, and optional
  `RESEND_FROM_NAME=Jafar Dabbagh`.
- `SEGMENT_NEWSLETTER_ID` and all five topic variables above.
- `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` for the intended database.
- `NEXT_PUBLIC_SITE_URL=https://www.jafardabbagh.com`.

Apply only the pending reviewed migrations, in order:

1. `supabase/migrations/20261011125729_newsletter_confirmations.sql`
2. `supabase/migrations/20261011170000_newsletter_digest_preferences.sql`

The first creates private, short-lived confirmation records and server-only
functions. The second extends the allowed choices without enrolling anyone.
The public Supabase key cannot read the table or execute its functions.

Preview email is blocked unless `NEWSLETTER_ALLOW_PREVIEW=true`. Use a separate
test Resend audience/topics, a test database, and the preview's own origin when
opting into preview delivery. Production credentials do not belong in previews.
Missing configuration gives a clear unavailable state instead of claiming success.
Deployment/redeployment is necessary to pick up new Vercel variables; production
release and live email testing remain explicit operator actions.

## Automatic publication and roundups

The `automatic-newsletter` workflow runs on writing/project-announcement pushes to
main, hourly at minute 17, and on manual dispatch. It is **disabled by default**.
The immediate post-push run may see the prior deployment; the hourly run catches up
once the new content is live. GitHub schedules can be delayed, so 09:00 is a due
time, not a guaranteed inbox delivery minute.

The runner compares each candidate's content fingerprint with the public production
receipt at `/api/newsletter/publications`. Changed/unpublished drafts are not sent.
`data/newsletter-baseline.json` excludes the entire archive that existed when this
feature was introduced. Do not regenerate that baseline when adding new writing.
New slugs must have a valid publication date on/after the activation day and no
later than today. Full timestamps are respected; date-only bylines use Grenada's
calendar day. Backdated imports before activation and future-dated work are skipped.

- Essays: publish real content in `content/essays.json` using a new stable slug.
- Field notes: publish in `content/field-notes.json` using a new stable slug.
- Project updates: add an actual announcement to `data/projectUpdates.ts` with a
  stable slug, title, date, excerpt and destination URL. An empty list is valid.
  Editing the AXOM card does not manufacture a new project announcement.
- Weekly periods run Sunday midnight to the next Sunday midnight, Grenada time.
- Monthly periods cover the previous calendar month. Empty periods send nothing.
- Roundups include previews of eligible essays, field notes and project updates.
  Current-period content waits for the next roundup. The latest completed period
  is retried after failures; older missed digests are not replayed as a backlog.

Each alert has a stable provider name based on type/slug; each digest uses its
cadence/period. Sent/queued broadcasts are never resent. Reruns recover an existing
draft and update it to the current live content before requesting delivery.
All sending workflows share one non-cancelling concurrency group. Do not run local
sending scripts concurrently or delete provider history used for deduplication.
A successful send response is provider acceptance, not proof of inbox delivery.
Resend owns suppression, delivery history and subscriber export.

No Git commits to main are needed for automated delivery. The provider's durable
broadcast record is the dispatch ledger. Rendered HTML/text previews are retained
as workflow artifacts for 14 days. A failed provider call fails the workflow;
subsequent runs recover by provider name. Monitor GitHub and Resend failure reports.

## Activation after an authorized inbox test

In GitHub, create/use the `newsletter` environment, restrict it to main, and add
`RESEND_API_KEY`, `RESEND_FROM_EMAIL`, `SEGMENT_NEWSLETTER_ID` and all five topic IDs
as environment secrets. No Supabase key is required for the broadcaster.

Repository Actions variables:

- `NEWSLETTER_STARTS_AT`: explicit ISO activation timestamp, for example
  `2026-10-20T09:00:00-04:00` (replace with the actual activation time).
- `NEWSLETTER_AUTOMATION_ENABLED=true`: set **last**, after acceptance.

The activation variable must be a repository variable because the job condition
is evaluated before environment variables are available. While testing, environment
reviewers can guard manual runs. For unattended scheduled delivery, remove the
per-run approval requirement only after choosing to activate automation, while
retaining the main-only restriction and secret access. Leaving a reviewer gate
in place means every scheduled run will wait for approval.

Acceptance with an authorized recipient: subscribe to one topic, receive and
confirm the link, verify membership/topic states, change to a cadence, receive a
topic-scoped test broadcast, use its native preference page, then opt out and
verify exclusion from a later test. Check Gmail/iCloud or another real inbox for
layout, links and spam placement. Never test by blasting the production audience.
A single-address transactional preview cannot prove native broadcast unsubscribe.

## Preview and manual controls

- `/newsletter/preview` shows all five example email types, using actual archive
  content. These examples are labelled; they are not claims of new activity.
- `npm run email:preview` renders five HTML/text examples to `artifacts/newsletter`
  without calling Resend. Their unsubscribe placeholders resolve only in broadcasts.
- `npm run email:dispatch` lists real publication slugs without sending.
- `DRY_RUN_EMAILS=true npm run email:dispatch -- --type=essay --slug=<slug>` renders
  one publication to `/tmp/email-preview.html` and `/tmp/email-preview.txt`.
- The main-only `publication-email` workflow creates a selected provider draft by
  default. Its explicit send switch sends it. Reruns refresh draft content from
  source; edit source first, not just the provider draft. This explicit manual path
  can send historical work and does not use the automatic archive exclusion.
- `--test-to=<authorized-address>` is a real single-address send, not an offline
  preview. The old broadcast HTTP endpoint remains retired (410 when authorized).

## Privacy and verification

Confirmation records contain email, choices, intent, timestamps, a SHA-256 token
digest and keyed IP hash. Tokens have 32 random bytes, expire in 30 minutes, are
single-use, and arrive in the URL fragment, which is removed immediately. Opening
a link does not change preferences. Consuming it invalidates sibling links.
Limits are three requests per address and ten per connection per hour, enforced
under database locks. Honeypots send no email. Old records are removed on the next
request after seven days. A failed provider write is surfaced; the user requests a
new link and reviews current state. No subscriber addresses appear in the public
publication receipt, preview artifacts, or browser analytics.

Run `npm test`, `npm run lint`, `npm run build`, `npm run typecheck`, and
`npm run test:browser:newsletter`. The browser test runs the built Next app, actual
PGlite PostgreSQL and a local Resend HTTP simulator. It covers all five choices,
confirmation, replay, preference changes, unsubscribe and provider failures. It
sends no email and cannot establish provider DNS/account/inbox readiness.
