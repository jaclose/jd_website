import { NextResponse } from "next/server";
import { sendPublicationBroadcast } from "@/lib/email/sendPublicationBroadcast";
import type { PublicationPayload } from "@/lib/email/templates/publicationBroadcast";

/**
 * Creates (and optionally sends) a Resend Broadcast for a freshly published
 * essay/field note. Guarded by a shared secret so only trusted callers (a CI
 * step or a manual curl) can email the list.
 *
 *   curl -X POST $SITE/api/broadcast/new-publication \
 *     -H "x-publish-secret: $PUBLISH_WEBHOOK_SECRET" \
 *     -H "content-type: application/json" \
 *     -d '{"type":"essay","title":"...","slug":"...","excerpt":"...","sendImmediately":false}'
 */
export async function POST(req: Request) {
  const secret = process.env.PUBLISH_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json({ ok: false, error: "Broadcast endpoint not configured." }, { status: 503 });
  }
  if (req.headers.get("x-publish-secret") !== secret) {
    return NextResponse.json({ ok: false, error: "Unauthorized." }, { status: 401 });
  }

  let body: (PublicationPayload & { sendImmediately?: boolean; scheduledAt?: string }) | null = null;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON." }, { status: 400 });
  }
  if (!body || (body.type !== "essay" && body.type !== "field_note")) {
    return NextResponse.json({ ok: false, error: "type must be essay | field_note." }, { status: 400 });
  }
  if (!body.title || typeof body.title !== "string") {
    return NextResponse.json({ ok: false, error: "title is required." }, { status: 400 });
  }

  const result = await sendPublicationBroadcast(
    {
      type: body.type,
      title: body.title,
      slug: body.slug,
      excerpt: body.excerpt,
      publishedAt: body.publishedAt,
      url: body.url,
      heroImage: body.heroImage,
      tags: body.tags,
    },
    { sendImmediately: !!body.sendImmediately, scheduledAt: body.scheduledAt }
  );

  return NextResponse.json(result, { status: result.ok ? 200 : 502 });
}
