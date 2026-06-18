# Email System - Resend Broadcasts and Segments

The mailing list lives in Resend. This site only collects signup intent, creates
or reuses a Resend Contact, adds that contact to the right Segment, and creates
Resend Broadcasts when new writing is published. There is no local subscriber
table; Resend owns contacts, unsubscribes, personalization, export, and
deliverability.

## Files

| File | Role |
|---|---|
| `components/newsletter/NewsletterSignup.tsx` | Client signup UI with email, optional first name, honeypot, and hidden source/slug/type fields. |
| `components/newsletter/EssaySignup.tsx` | Essay and field-note footer wrapper. |
| `app/api/newsletter/subscribe/route.ts` | Server-only signup route. Validates, rate-limits, creates Contacts, and adds Segments. |
| `lib/newsletter/subscription.ts` | Testable subscription validation, rate limiting, and Resend contact/segment logic. |
| `lib/resend/client.ts` | Server-only Resend client and environment wiring. |
| `lib/email/templates/publicationBroadcast.ts` | Reusable HTML and plain-text broadcast template. |
| `lib/email/sendPublicationBroadcast.ts` | Creates draft, immediate, or scheduled Resend Broadcasts. |
| `scripts/send-publication-broadcast.ts` | Scans published essays and field notes, dedupes, and dispatches broadcasts. |
| `data/email-dispatch-log.json` | Broadcast dedupe log. This is not a mailing list. Commit it after real dispatches. |

## Environment

Set these in Vercel and in `.env.local` for local testing:

```bash
RESEND_API_KEY=          # full-access server-side key
RESEND_FROM_EMAIL=notes@jafardabbagh.com
RESEND_FROM_NAME=Jafar Dabbagh
SEGMENT_ESSAYS_ID=
SEGMENT_FIELDNOTES_ID=
NEXT_PUBLIC_SITE_URL=https://www.jafardabbagh.com
```

Optional:

```bash
RESEND_TOPIC_ID=         # optional Broadcast topic for granular unsubscribes
PUBLISH_WEBHOOK_SECRET=  # required only for POST /api/broadcast/new-publication
DRY_RUN_EMAILS=true      # render previews without calling Resend
```

Create the two Segments in Resend first, either in the dashboard or with the
Segments API:

- Essay subscribers -> `SEGMENT_ESSAYS_ID`
- Field-note subscribers -> `SEGMENT_FIELDNOTES_ID`

Do not use `RESEND_AUDIENCE_ID`. Audiences are deprecated in the current SDK;
Contacts plus Segments are the supported path.

## Subscribe Flow

Essay pages and every field note render `EssaySignup`. The form sends:

- `email`
- optional `firstName`
- hidden `source`: `essay_footer`, `fieldnote_footer`, or `site_footer`
- hidden `slug`
- hidden `contentType`: `essay`, `field_note`, or `all`
- hidden honeypot field: `company`

`POST /api/newsletter/subscribe` never exposes `RESEND_API_KEY`. It validates the
email, rate-limits by IP and email, silently accepts honeypot submissions without
calling Resend, creates the Contact with `resend.contacts.create`, then adds the
Contact with `resend.contacts.segments.add`.

Responses are intentionally small:

```json
{ "ok": true, "status": "subscribed" }
{ "ok": true, "status": "already_subscribed" }
{ "ok": false, "error": "Couldn't sign you up just now." }
```

## Broadcast Template

The reusable template includes:

- inline styles only
- safe font stacks
- HTML and plain-text output
- greeting placeholder: `{{{contact.first_name|there}}}`
- unsubscribe placeholder: `{{{RESEND_UNSUBSCRIBE_URL}}}`
- title, excerpt, date, and a read-more link

Resend replaces the personalization and unsubscribe placeholders at send time.

## Dispatch On Publish

After new content is fully committed, run the dispatch script:

```bash
# Preview only. Writes /tmp/email-preview.html and /tmp/email-preview.txt.
DRY_RUN_EMAILS=true npm run email:dispatch

# Create draft Broadcasts in Resend for manual review.
npm run email:dispatch

# Create and send immediately.
npm run email:dispatch -- --send

# Create and schedule.
npm run email:dispatch -- --schedule=2026-06-19T14:00:00.000Z
```

The script scans `content/essays.json` and `content/field-notes.json`, skips
anything already recorded in `data/email-dispatch-log.json`, and sends essays to
`SEGMENT_ESSAYS_ID` and field notes to `SEGMENT_FIELDNOTES_ID`.

After any real draft, send, or scheduled dispatch, commit
`data/email-dispatch-log.json` so the same slug is not emailed again.

## Single-Item Admin Route

For CI or a trusted manual call:

```bash
curl -X POST "$SITE/api/broadcast/new-publication" \
  -H "x-publish-secret: $PUBLISH_WEBHOOK_SECRET" \
  -H "content-type: application/json" \
  -d '{"type":"essay","title":"Title","slug":"slug","excerpt":"Short excerpt","sendImmediately":false}'
```

This route is guarded by `PUBLISH_WEBHOOK_SECRET`. Prefer the script when you
need dedupe logging in the repository.

## Deliverability

Verify the sending domain in Resend before sending:

- Use a real domain email, not Gmail.
- Add Resend's SPF and DKIM DNS records.
- Add a DMARC record for the domain.
- Keep the unsubscribe link in every Broadcast.
- Send only on real publish events.

## Tests

Run the newsletter-focused tests:

```bash
npm run test:newsletter
```

The tests cover new signups, duplicate Contact handling, Resend errors, invalid
emails, and IP/email rate limiting.
