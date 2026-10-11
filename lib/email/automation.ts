import { createHash } from "node:crypto";
import type { PublicationPayload } from "./templates/publicationBroadcast";
export type Cadence = "weekly" | "monthly";
export interface DigestPeriod { cadence: Cadence; key: string; start: Date; end: Date; due: Date }
export const publicationKey = (p: PublicationPayload) => `${p.type}:${p.slug}`;
export const publicationRevision = (p: PublicationPayload) => createHash("sha256").update(JSON.stringify(p)).digest("hex");

/** Date-only bylines use midnight Grenada time. No host timezone dependency. */
export function publicationTime(p: PublicationPayload) {
  if (!p.publishedAt) return NaN;
  return Date.parse(p.publishedAt.length === 10 ? `${p.publishedAt}T00:00:00-04:00` : p.publishedAt);
}
export function eligiblePublications(catalog: PublicationPayload[], baseline: string[], startsAt: Date, now: Date, live: Map<string, string>) {
  if (!Number.isFinite(startsAt.getTime()) || startsAt > now) throw new Error("Set NEWSLETTER_STARTS_AT to an explicit activation timestamp in the past.");
  if (new Set(catalog.map(publicationKey)).size !== catalog.length) throw new Error("Duplicate publication keys.");
  return catalog.filter(p => {
    const date = publicationTime(p);
    // A byline has day precision. New slugs published later on the activation
    // day must remain eligible; the baseline still excludes the entire archive.
    const localStart = new Date(startsAt.getTime() - 4 * 3600000);
    const cutoff = p.publishedAt?.length === 10 ? Date.UTC(localStart.getUTCFullYear(), localStart.getUTCMonth(), localStart.getUTCDate(), 4) : startsAt.getTime();
    return !!p.slug && !baseline.includes(publicationKey(p)) && Number.isFinite(date) && date >= cutoff && date <= now.getTime() && live.get(publicationKey(p)) === publicationRevision(p);
  });
}

/** Most recent completed periods. Grenada stays UTC-4; dispatch is due at 09:00.
 * Weekly periods end Sunday 00:00 local; monthly periods end on the 1st.
 * A delayed scheduler still finds the same period and provider deduplication key.
 */
export function digestPeriods(now: Date): DigestPeriod[] {
  const local = new Date(now.getTime() - 4 * 3600000);
  const y = local.getUTCFullYear(), m = local.getUTCMonth(), d = local.getUTCDate();
  const sunday = new Date(Date.UTC(y, m, d - local.getUTCDay(), 4));
  if (sunday.getTime() + 9 * 3600000 > now.getTime()) sunday.setUTCDate(sunday.getUTCDate() - 7);
  const month = new Date(Date.UTC(y, m, 1, 4));
  if (month.getTime() + 9 * 3600000 > now.getTime()) month.setUTCMonth(month.getUTCMonth() - 1);
  return [
    { cadence: "weekly", key: sunday.toISOString().slice(0, 10), start: new Date(sunday.getTime() - 7 * 86400000), end: sunday, due: new Date(sunday.getTime() + 9 * 3600000) },
    { cadence: "monthly", key: month.toISOString().slice(0, 7), start: new Date(Date.UTC(month.getUTCFullYear(), month.getUTCMonth() - 1, 1, 4)), end: month, due: new Date(month.getTime() + 9 * 3600000) },
  ];
}
export function digestItems(items: PublicationPayload[], period: DigestPeriod) {
  return items.filter(p => publicationTime(p) >= period.start.getTime() && publicationTime(p) < period.end.getTime()).sort((a,b) => publicationTime(b) - publicationTime(a));
}
