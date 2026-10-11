import { publicationCatalog } from "@/lib/email/catalog";
import { publicationKey, publicationRevision } from "@/lib/email/automation";
/** Deployment receipt for public content. No email addresses or account data. */
export function GET() {
  return Response.json({ version: 1, publications: publicationCatalog().map(p => ({ key: publicationKey(p), revision: publicationRevision(p) })) }, { headers: { "Cache-Control": "public, max-age=60, s-maxage=60" } });
}
