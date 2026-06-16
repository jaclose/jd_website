import { NextResponse } from "next/server";

/**
 * Email signups relay to Buttondown. Set BUTTONDOWN_API_KEY in the
 * environment (Vercel → Settings → Environment Variables). New essays and
 * field notes go out automatically via Buttondown's RSS automation pointed
 * at /feed.xml; announcements you send as a normal Buttondown email.
 */
const ENDPOINT = "https://api.buttondown.email/v1/subscribers";

export async function POST(req: Request) {
  const key = process.env.BUTTONDOWN_API_KEY;
  if (!key) {
    return NextResponse.json(
      { ok: false, message: "The mailing list isn't wired up yet." },
      { status: 503 }
    );
  }

  let email = "";
  try {
    const body = await req.json();
    email = String(body?.email ?? "").trim().toLowerCase();
  } catch {
    /* fall through to validation */
  }
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return NextResponse.json(
      { ok: false, message: "That doesn't look like an email." },
      { status: 400 }
    );
  }

  try {
    const res = await fetch(ENDPOINT, {
      method: "POST",
      headers: { Authorization: `Token ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        email_address: email,
        tags: ["jd1184-site"],
        referrer_url: "https://www.jafardabbagh.com",
      }),
    });
    if (res.ok) {
      return NextResponse.json({ ok: true, message: "You're on the manifest — watch the sky." });
    }
    const detail = JSON.stringify(await res.json().catch(() => ({}))).toLowerCase();
    if (res.status === 400 && (detail.includes("already") || detail.includes("exist"))) {
      return NextResponse.json({ ok: true, message: "You're already on the list." });
    }
    return NextResponse.json(
      { ok: false, message: "Couldn't sign you up just now." },
      { status: 502 }
    );
  } catch {
    return NextResponse.json(
      { ok: false, message: "The relay is down — try again shortly." },
      { status: 502 }
    );
  }
}
