import type { Metadata } from "next";
import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
export const metadata: Metadata = { title: "Email privacy — Jafar Dabbagh", alternates: { canonical: "/newsletter/privacy" } };
export default function EmailPrivacy() {
  return <><SiteHeader /><main className="letters-confirm"><p className="label text-starlight">Email privacy</p><h1>A small list.<br /><em>A clear choice.</em></h1><div className="prose-space">
    <p>The mailing list uses your email address and selected preferences to send essays, field notes, and project updates from Jafar Dabbagh. You must confirm your choices through a link sent to your inbox before receiving these updates.</p>
    <p>Resend stores subscribed contacts, their preferences, and delivery records. Supabase stores short-lived confirmation requests. Links expire after 30 minutes and work once. Request records are removed after seven days when the next request is processed. A keyed hash of the connection address helps limit repeated requests; the raw address is not stored in the newsletter database.</p>
    <p>Every publication email has a preference and unsubscribe link. You can also request a private link here to change your choices or stop all updates.</p>
    <p>Your email is not published on the site. The Vault journal stays in your browser and is separate from the mailing list.</p>
    <p>For a copy of your mailing-list data or a deletion request, contact <a href="mailto:jafardabbagh@gmail.com">jafardabbagh@gmail.com</a>.</p>
    <Link href="/newsletter#preferences">Manage your email preferences →</Link>
  </div></main></>;
}
