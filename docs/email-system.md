# Email system — Resend Broadcasts

The list lives in **Resend**. Visitors subscribe from the end of every essay and
field note (and the site footer); publishing a new essay/field note creates a
Resend **Broadcast** to the audience. Nothing homemade stores the list — Resend
is the source of truth and owns unsubscribe.

## Pieces

| File | Role |
|---|---|
| `lib/resend/client.ts` | Server-only Resend client + env (`canSubscribe` / `canBroadcast` / `DRY_RUN`). |
| `app/api/newsletter/subscribe/route.ts` | Adds a contact to the audience. Honeypot + rate limit. Never leaks the key or raw Resend errors. |
| `app/api/broadcast/new-publication/route.ts` | Secret-guarded (`x-publish-secret`) — creates/sends a broadcast for one item. |
| `lib/email/templates/publicationBroadcast.ts` | `renderPublicationBroadcastHtml` + `renderPublicationBroadcastText`. |
| `lib/email/sendPublicationBroadcast.ts` | Creates a draft (or sends) broadcast; honours `DRY_RUN_EMAILS`. |
| `scripts/send-publication-broadcast.ts` | Scans essays + field notes, dedupes via the log, makes broadcasts. `npm run email:dispatch`. |
| `data/email-dispatch-log.json` | Permanent dedupe state — an item is emailed once. Commit it. |
| `components/newsletter/NewsletterSignup.tsx` / `EssaySignup.tsx` | The signup UI. |

## Environment

Set in Vercel → Settings → Environment Variables (and `.env.local` for dev):

```
RESEND_API_KEY=          # secret — server only
RESEND_FROM_EMAIL=notes@jafardabbagh.com   # on a VERIFIED domain, not gmail
RESEND_FROM_NAME=Jafar Dabbagh
RESEND_AUDIENCE_ID=      # Resend → Audiences → your list → ID
PUBLISH_WEBHOOK_SECRET=  # random string; guards the broadcast route
NEXT_PUBLIC_SITE_URL=https://www.jafardabbagh.com
DRY_RUN_EMAILS=          # "true" to render without sending
```

> Resend Contacts don't store arbitrary custom fields, so `source` / `slug` are
> logged server-side for audit (and could become tags/segments later). Email +
> first name go to Resend.

## Deliverability (do this once)

1. **Verify your domain** in Resend → Domains. Add the DNS records it gives you.
2. Configure **SPF, DKIM, DMARC** (Resend's domain step sets SPF/DKIM; add a
   DMARC TXT record like `v=DMARC1; p=none; rua=mailto:you@domain`).
3. Use a real **from address**: `Jafar Dabbagh <notes@jafardabbagh.com>`. **Never
   send from a Gmail address** — it will fail DMARC and land in spam.
4. Keep the **unsubscribe** link active (the template includes Resend's
   `{{{RESEND_UNSUBSCRIBE_URL}}}` token; Broadcasts handle the rest).
5. Avoid spammy subject lines (no ALL CAPS, no "FREE!!!"). The templates use
   `New Essay: …` / `New Field Note: …`.
6. Only send on **real publish events** — never on draft saves.

## Sending on publish

After a new essay/field note lands in `content/`:

```bash
# 1. preview only — writes /tmp/email-preview.html, no Resend calls
DRY_RUN_EMAILS=true npm run email:dispatch

# 2. create DRAFT broadcasts in Resend (review, then send from the dashboard)
npm run email:dispatch

# 3. or create AND send immediately
npm run email:dispatch -- --send
```

Then commit the updated `data/email-dispatch-log.json` so the item is never
emailed twice.

Single item by hand / from CI (guarded):

```bash
curl -X POST "$SITE/api/broadcast/new-publication" \
  -H "x-publish-secret: $PUBLISH_WEBHOOK_SECRET" \
  -H "content-type: application/json" \
  -d '{"type":"essay","title":"…","slug":"…","excerpt":"…","sendImmediately":false}'
```

## Notes

- **Marketing vs transactional**: Broadcasts are for publication/announcement
  emails. Keep any future transactional mail (confirmations, etc.) on a separate
  Resend path so reputation doesn't mix.
- The subscribe route is rate-limited per instance and honeypotted; add
  Cloudflare Turnstile if spam appears.
