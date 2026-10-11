import type { Metadata } from "next";
import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import EmailPreview from "@/components/newsletter/EmailPreview";
import { publicationCatalog } from "@/lib/email/catalog";
import { publicationSubject, renderPublicationBroadcastHtml } from "@/lib/email/templates/publicationBroadcast";
import { renderDigest } from "@/lib/email/templates/digest";
export const metadata: Metadata = { title: "Preview a letter — Jafar Dabbagh", description: "A look inside the essays, field notes, and roundups from JD-1184.", alternates: { canonical: "/newsletter/preview" } };
export default function PreviewPage() {
  const catalog = publicationCatalog();
  const selected = ["essay", "field_note", "deployment"].flatMap(type => catalog.find(p => p.type === type) ?? []);
  const examples = [...selected.map(p => ({ label: p.type === "essay" ? "Essay" : p.type === "field_note" ? "Field note" : "Project", subject: publicationSubject(p), html: renderPublicationBroadcastHtml(p) })), ...(["weekly", "monthly"] as const).map(c => ({ label: c === "weekly" ? "Weekly" : "Monthly", ...renderDigest(c, "Archive preview", selected) }))];
  return <><SiteHeader current="newsletter" /><main className="letter-preview-page"><p className="label text-starlight">Inside the envelope</p><h1>A slower kind<br /><em>of notification.</em></h1><p>Writing and work, with enough of each to know whether you want to read on.</p><EmailPreview examples={examples} /><Link prefetch={false} className="editorial-link" href="/newsletter">Choose your letters →</Link></main></>;
}
