/**
 * Scan published essays + field notes and create a Resend Broadcast for any
 * that haven't been dispatched yet. Dedupes forever via the dispatch log, so
 * an essay is only emailed once.
 *
 *   npm run email:dispatch            # create DRAFT broadcasts (review in Resend)
 *   npm run email:dispatch -- --send  # create AND send immediately
 *   DRY_RUN_EMAILS=true npm run email:dispatch   # render only, no Resend calls
 *
 * Run locally or in CI after content lands. Commit the updated dispatch log.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { essays, fieldNotes } from "@/lib/content";
import { SITE_ORIGIN, DRY_RUN } from "@/lib/resend/client";
import { sendPublicationBroadcast } from "@/lib/email/sendPublicationBroadcast";

interface DispatchEntry {
  contentType: "essay" | "field_note";
  slug: string;
  title: string;
  broadcastId?: string;
  createdAt: string;
  sentAt?: string;
  status: string;
}
interface DispatchLog {
  dispatches: DispatchEntry[];
}

const LOG_PATH = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "data", "email-dispatch-log.json");

function loadLog(): DispatchLog {
  try {
    return JSON.parse(readFileSync(LOG_PATH, "utf8")) as DispatchLog;
  } catch {
    return { dispatches: [] };
  }
}
function saveLog(log: DispatchLog) {
  writeFileSync(LOG_PATH, `${JSON.stringify(log, null, 2)}\n`);
}

async function main() {
  const send = process.argv.includes("--send");
  const log = loadLog();
  const done = new Set(log.dispatches.map((d) => `${d.contentType}:${d.slug}`));

  const queue = [
    ...essays.map((e) => ({
      contentType: "essay" as const,
      slug: e.slug,
      title: e.title,
      excerpt: e.excerpt,
      publishedAt: e.date,
      url: `${SITE_ORIGIN}/essays/${e.slug}`,
    })),
    ...fieldNotes.map((n) => ({
      contentType: "field_note" as const,
      slug: n.slug,
      title: n.title,
      excerpt: n.excerpt,
      publishedAt: n.date,
      url: `${SITE_ORIGIN}/field-notes#${n.slug}`,
    })),
  ].filter((item) => !done.has(`${item.contentType}:${item.slug}`));

  if (queue.length === 0) {
    console.log("Nothing new to dispatch — every published item already has a broadcast.");
    return;
  }
  console.log(`${queue.length} item(s) to dispatch${DRY_RUN ? " (DRY RUN)" : send ? " (will send)" : " (draft only)"}:`);

  for (const item of queue) {
    const result = await sendPublicationBroadcast(
      {
        type: item.contentType,
        title: item.title,
        slug: item.slug,
        excerpt: item.excerpt,
        publishedAt: item.publishedAt,
        url: item.url,
      },
      { sendImmediately: send }
    );
    console.log(`  · ${item.contentType} "${item.title}" → ${result.status}${result.broadcastId ? ` (${result.broadcastId})` : ""}${result.error ? ` — ${result.error}` : ""}`);

    // only record a permanent dispatch when Resend actually created something
    if (result.ok && result.status !== "dry_run") {
      log.dispatches.push({
        contentType: item.contentType,
        slug: item.slug,
        title: item.title,
        broadcastId: result.broadcastId,
        createdAt: new Date().toISOString(),
        sentAt: result.status === "sent" ? new Date().toISOString() : undefined,
        status: result.status,
      });
    }
  }

  if (!DRY_RUN) saveLog(log);
  console.log("Done. Commit data/email-dispatch-log.json to keep the dedupe state.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
