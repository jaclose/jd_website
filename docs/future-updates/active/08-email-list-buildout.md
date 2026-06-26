# 08 — Email list, fully built out

Status: 🟡 Planned · Pri: P1 · Effort: M · Area: Email
Tracks: "I also want the email list to be fully built out and suggestions on
tools."

## Goal
Take the existing Resend signup/broadcast plumbing from "wired" to "fully
operational": real verified sending domain, segments live, a welcome flow,
confirmed compliance, and a clear place to see subscriber state.

## Why it matters
The email list is the one durable audience asset. The pipes exist; it needs the
last-mile to actually run reliably and convert visitors.

## Current state (in repo) — already substantial
- [docs/email-system.md](../../email-system.md) — full architecture doc.
- [lib/newsletter/subscription.ts](../../../lib/newsletter/subscription.ts),
  [app/api/newsletter/subscribe/route.ts](../../../app/api/newsletter) — signup
  (validate, rate-limit, create Contact, add Segment).
- [lib/email/sendPublicationBroadcast.ts](../../../lib/email/sendPublicationBroadcast.ts),
  [lib/email/templates/publicationBroadcast.ts](../../../lib/email/templates/publicationBroadcast.ts),
  `scripts/send-publication-broadcast.ts` — broadcast on publish + dedupe log.
- `components/newsletter/NewsletterSignup.tsx` / `EssaySignup.tsx` — signup UI.
- [app/api/broadcast](../../../app/api/broadcast) — single-item admin route.

## Gaps to close (the "fully built out" list)
```
  signup  → [exists]
  segments→ [exists, IDs must be set in env]
  domain  → [TODO verify SPF/DKIM/DMARC in Resend]   ← deliverability gate
  welcome → [TODO double opt-in + welcome email]
  broadcast→[exists, dry-run + send + schedule]
  view    → [TODO subscriber/broadcast view] → spec 09 dashboard
  test    → [exists: npm run test:newsletter]
```

## To-do (frames)
- [ ] Verify the sending domain in Resend (real domain, SPF + DKIM + DMARC) — the
      blocking deliverability step from email-system.md §Deliverability.
- [ ] Create + set `SEGMENT_ESSAYS_ID` / `SEGMENT_FIELDNOTES_ID` in Vercel + local.
- [ ] Welcome flow: send a welcome email on first subscribe; decide on
      **double opt-in** (confirm link) for list hygiene/compliance.
- [ ] Confirm unsubscribe + `{{{RESEND_UNSUBSCRIBE_URL}}}` in every broadcast;
      optional `RESEND_TOPIC_ID` for granular topics.
- [ ] Harden rate-limit: move from in-memory to `@upstash/ratelimit` + Redis for
      multi-instance correctness.
- [ ] Signup conversion polish: clearer placement (footer + after essays), success
      micro-copy, and a single source of analytics events.
- [ ] Subscriber/broadcast *visibility* → surface counts in the admin dashboard
      (spec 09). Resend stays the source of truth (no local subscriber table).
- [ ] Author broadcast templates with **React Email** for easier iteration.
- [ ] Document the full runbook (verify → segment → welcome → publish → dispatch).

## Tools / libraries
Resend (current), React Email (templates), `@upstash/ratelimit` + Upstash Redis,
Resend Segments API. Alternatives only if migrating: Loops, ConvertKit,
Buttondown. TOOLS-CATALOG §5.

## Acceptance criteria
- A real subscriber receives a welcome email; domain passes SPF/DKIM/DMARC.
- Publishing an essay/field-note dispatches to the right segment with working
  unsubscribe; dedupe log prevents double-sends.
- `npm run test:newsletter` green; runbook documented.

## Dependencies / risks
- DNS/domain verification is external (Resend dashboard + DNS host).
- Compliance (CAN-SPAM/GDPR): unsubscribe + consent must be real before sending.
- Visibility piece overlaps spec 09 — keep Resend as source of truth.
