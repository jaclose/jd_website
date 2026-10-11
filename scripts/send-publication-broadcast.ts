/** Explicit publication only. Default creates a draft; --send sends that draft. */
import { readFileSync, writeFileSync, renameSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { publications, selectPublication } from "@/lib/email/publications";
import { DRY_RUN } from "@/lib/resend/client";
import { sendPublicationBroadcast, sendPublicationTest } from "@/lib/email/sendPublicationBroadcast";

type DispatchEntry = { contentType: string; slug: string; title: string; broadcastId?: string; createdAt: string; sentAt?: string; status: string };
const LOG_PATH = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "data", "email-dispatch-log.json");
const argument = (name: string) => process.argv.find(v => v.startsWith(`--${name}=`))?.slice(name.length + 3);
async function main() {
  const slug = argument("slug"); const type = argument("type");
  if (!slug || !type) {
    console.log("Select one publication with --type=essay|field_note|deployment --slug=<slug>. No email was created or sent.");
    for (const item of publications()) console.log(`${item.type}: ${item.slug}`);
    if (process.argv.includes("--send")) process.exitCode = 1;
    return;
  }
  const item = selectPublication(type, slug);
  if (!item) throw new Error("Publication not found. Use the exact type and slug.");
  const testTo = argument("test-to");
  if (testTo) {
    const result = await sendPublicationTest(item, testTo);
    if (!result.ok) throw new Error(result.error);
    console.log(result.status); return;
  }
  // Corrupt/missing state is an error, never an excuse to resend the archive.
  const log = JSON.parse(readFileSync(LOG_PATH, "utf8")) as { dispatches: DispatchEntry[] };
  if (!Array.isArray(log.dispatches)) throw new Error("Invalid dispatch log.");
  const existing = log.dispatches.find(d => d.contentType === type && (d.slug === slug || (type === "deployment" && slug === "axom" && d.slug === "noctyrium")));
  if (existing?.status === "sent" || existing?.status === "scheduled") { console.log("Already dispatched; no email sent."); return; }
  const result = await sendPublicationBroadcast(item, { sendImmediately: process.argv.includes("--send") });
  if (!result.ok) throw new Error(result.error);
  console.log(`${type}:${slug} → ${result.status}`);
  if (DRY_RUN) return;
  const entry = { contentType: type, slug, title: item.title, broadcastId: result.broadcastId, createdAt: existing?.createdAt || new Date().toISOString(), sentAt: result.status === "sent" ? new Date().toISOString() : undefined, status: result.status };
  if (existing) Object.assign(existing, entry); else log.dispatches.push(entry);
  writeFileSync(`${LOG_PATH}.tmp`, `${JSON.stringify(log, null, 2)}\n`);
  renameSync(`${LOG_PATH}.tmp`, LOG_PATH);
}
main().catch(error => { console.error(error instanceof Error ? error.message : "Dispatch failed."); process.exitCode = 1; });
