/**
 * Scan published essays + field notes + duel-field deployments and create a
 * Resend Broadcast for any that haven't been dispatched yet. Dedupes forever
 * via the dispatch log, so an item is only emailed once.
 *
 *   npm run email:dispatch            # create DRAFT broadcasts (review in Resend)
 *   npm run email:dispatch -- --send  # create AND send immediately
 *   npm run email:dispatch -- --schedule=2026-06-19T14:00:00.000Z
 *   DRY_RUN_EMAILS=true npm run email:dispatch   # render only, no Resend calls
 *
 *   # test mode: email ONE address the most recent item (or --slug=…),
 *   # using the real template — no broadcast, no log entry:
 *   npm run email:dispatch -- --test-to=you@example.com
 *   npm run email:dispatch -- --test-to=you@example.com --slug=the-cost-of-knowing-better
 *
 * Run locally or in CI after content lands. Commit the updated dispatch log.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { essays, fieldNotes } from "@/lib/content";
import { deployments } from "@/data/deployments";
import { SITE_ORIGIN, DRY_RUN } from "@/lib/resend/client";
import { sendPublicationBroadcast, sendPublicationTest } from "@/lib/email/sendPublicationBroadcast";

interface DispatchEntry {
  contentType: "essay" | "field_note" | "deployment";
  slug: string;
  title: string;
  broadcastId?: string;
  createdAt: string;
  sentAt?: string;
  scheduledAt?: string;
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

function allPublications() {
  return [
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
    ...deployments.map((d) => ({
      contentType: "deployment" as const,
      slug: d.id,
      title: d.name,
      excerpt: d.effect,
      publishedAt: d.deployedAt,
      url: d.webUrl ?? `${SITE_ORIGIN}/#deployments`,
    })),
  ];
}

async function main() {
  const send = process.argv.includes("--send");
  const testTo = process.argv.find((arg) => arg.startsWith("--test-to="))?.split("=")[1];
  const onlySlug = process.argv.find((arg) => arg.startsWith("--slug="))?.split("=")[1];
  const scheduledAt =
    process.argv.find((arg) => arg.startsWith("--scheduledAt="))?.split("=").slice(1).join("=") ||
    process.argv.find((arg) => arg.startsWith("--schedule="))?.split("=").slice(1).join("=");

  // ── test mode: one real email to one address, no broadcast, no log ──
  if (testTo) {
    const pool = allPublications().filter((p) => !onlySlug || p.slug === onlySlug);
    const item = pool.sort((a, b) => (b.publishedAt ?? "").localeCompare(a.publishedAt ?? ""))[0];
    if (!item) {
      console.error(onlySlug ? `No publication with slug "${onlySlug}".` : "Nothing published yet.");
      process.exit(1);
    }
    console.log(`Test send → ${testTo}: ${item.contentType} "${item.title}"`);
    const result = await sendPublicationTest(
      {
        type: item.contentType,
        title: item.title,
        slug: item.slug,
        excerpt: item.excerpt,
        publishedAt: item.publishedAt,
        url: item.url,
      },
      testTo
    );
    console.log(`  → ${result.status}${result.broadcastId ? ` (${result.broadcastId})` : ""}${result.error ? ` — ${result.error}` : ""}`);
    if (!result.ok) process.exit(1);
    return;
  }

  const log = loadLog();
  const done = new Set(log.dispatches.map((d) => `${d.contentType}:${d.slug}`));

  const queue = allPublications().filter(
    (item) => !done.has(`${item.contentType}:${item.slug}`) && (!onlySlug || item.slug === onlySlug)
  );

  if (queue.length === 0) {
    console.log("Nothing new to dispatch — every published item already has a broadcast.");
    return;
  }
  console.log(
    `${queue.length} item(s) to dispatch${DRY_RUN ? " (DRY RUN)" : scheduledAt ? ` (scheduled for ${scheduledAt})` : send ? " (will send)" : " (draft only)"}:`
  );

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
      { sendImmediately: send, scheduledAt }
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
        scheduledAt: result.status === "scheduled" ? scheduledAt : undefined,
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
