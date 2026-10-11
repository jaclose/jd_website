/** Default is an offline preview. Only --send plus explicit activation contacts Resend. */
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import baseline from "@/data/newsletter-baseline.json";
import { publicationCatalog } from "@/lib/email/catalog";
import { digestItems, digestPeriods, eligiblePublications, publicationKey } from "@/lib/email/automation";
import { publicationSubject, publicationPreviewText, renderPublicationBroadcastHtml, renderPublicationBroadcastText } from "@/lib/email/templates/publicationBroadcast";
import { renderDigest } from "@/lib/email/templates/digest";
import { sendPreparedBroadcast, type PreparedBroadcast } from "@/lib/email/sendPreparedBroadcast";
import { SITE_URL } from "@/lib/seo";
import { canSubscribe } from "@/lib/resend/client";

async function main() {
  const send = process.argv.includes("--send");
  if (send && process.env.NEWSLETTER_AUTOMATION_ENABLED !== "true") throw new Error("Automation is disabled. Preview first; activate only after inbox acceptance.");
  if (send && process.env.GITHUB_ACTIONS && process.env.GITHUB_REF !== "refs/heads/main") throw new Error("Automatic dispatch requires main.");
  if (send && !canSubscribe()) throw new Error("Configure the sender, site segment and all five distinct topics before activating automation.");
  const now = new Date();
  const catalog = publicationCatalog();
  let items = catalog;
  if (send) {
    const response = await fetch(`${SITE_URL}/api/newsletter/publications`, { signal: AbortSignal.timeout(15000), cache: "no-store" });
    if (!response.ok) throw new Error("Could not verify the live publication catalog. No email sent.");
    const live = await response.json() as { version?: number; publications?: { key: string; revision: string }[] };
    if (live.version !== 1 || !Array.isArray(live.publications) || live.publications.some(p => typeof p.key !== "string" || typeof p.revision !== "string")) throw new Error("Invalid live publication receipt.");
    if (baseline.version !== 1 || !Array.isArray(baseline.archivedKeys)) throw new Error("Missing archive baseline.");
    items = eligiblePublications(catalog, baseline.archivedKeys, new Date(process.env.NEWSLETTER_STARTS_AT ?? ""), now, new Map(live.publications.map(p => [p.key, p.revision])));
  }
  const mail: PreparedBroadcast[] = [];
  const alerts = send ? items : ["essay", "field_note", "deployment"].flatMap(type => catalog.find(p => p.type === type) ?? []);
  for (const p of alerts) mail.push({ channel: p.type === "deployment" ? "project" : p.type, name: `jd1184:${publicationKey(p)}`, subject: publicationSubject(p), previewText: publicationPreviewText(p), html: renderPublicationBroadcastHtml(p), text: renderPublicationBroadcastText(p) });
  for (const period of digestPeriods(now)) {
    const content = send ? digestItems(items, period) : alerts;
    if (!content.length) continue;
    const label = send ? `${period.start.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "America/Grenada" })} – ${new Date(period.end.getTime() - 1).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "America/Grenada" })}` : "Archive preview";
    mail.push({ channel: period.cadence, name: `jd1184:${period.cadence}:${period.key}`, ...renderDigest(period.cadence, label, content) });
  }
  const folder = path.resolve("artifacts/newsletter");
  await mkdir(folder, { recursive: true });
  const failures: string[] = [];
  for (const m of mail) {
    const filename = m.name.replaceAll(":", "-");
    await writeFile(path.join(folder, `${filename}.html`), m.html);
    await writeFile(path.join(folder, `${filename}.txt`), m.text);
    if (send) {
      try {
        const result = await sendPreparedBroadcast(m, { sendImmediately: true });
        console.log(`${m.name}: ${result.status}`);
      } catch {
        // A single held/failed publication must not starve the other topics.
        failures.push(m.name);
      }
    }
  }
  if (failures.length) throw new Error(`Provider dispatch needs review for: ${failures.join(", ")}. Check Resend logs; reruns recover existing names.`);
  console.log(send ? `${mail.length} eligible broadcasts checked. Sent/queued names are never resent; empty periods are skipped.` : `Rendered ${mail.length} archive examples in artifacts/newsletter. No provider calls; no email sent.`);
}
main().catch(error => { console.error(error instanceof Error ? error.message : "Newsletter automation failed."); process.exitCode = 1; });
