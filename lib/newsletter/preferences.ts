export const NEWSLETTER_CHOICES = [
  { id: "essay", label: "Essays", detail: "Longer work on medicine, faith, and attention." },
  { id: "field_note", label: "Field notes", detail: "Short observations between the longer pieces." },
  { id: "project", label: "Project updates", detail: "Occasional notes on AXOM and things I’m building." },
  { id: "weekly", label: "Weekly letters", detail: "A Sunday digest of new writing and project notes, with previews." },
  { id: "monthly", label: "Monthly letters", detail: "A quieter roundup on the 1st. Nothing new, no email." },
] as const;
export type NewsletterPreference = (typeof NEWSLETTER_CHOICES)[number]["id"];
export function parsePreferences(value: unknown): NewsletterPreference[] | null {
  if (!Array.isArray(value) || value.length > NEWSLETTER_CHOICES.length || value.some(v => !NEWSLETTER_CHOICES.some(c => c.id === v))) return null;
  return [...new Set(value)] as NewsletterPreference[];
}
