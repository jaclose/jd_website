import { NextResponse } from "next/server";
/** One dispatch owner prevents races and accidental sends from preview routes.
 * The authenticated endpoint explains the migration to the serialized workflow.
 */
export async function POST(req: Request) {
  const secret = process.env.PUBLISH_WEBHOOK_SECRET;
  if (!secret) return NextResponse.json({ ok: false, error: "Broadcast endpoint not configured." }, { status: 503 });
  if (req.headers.get("x-publish-secret") !== secret) return NextResponse.json({ ok: false, error: "Unauthorized." }, { status: 401 });
  return NextResponse.json({ ok: false, error: "Use the publication-email GitHub workflow with an explicit type and slug. This endpoint no longer creates or sends broadcasts." }, { status: 410 });
}
