import NewsletterSignup from "@/components/newsletter/NewsletterSignup";

/**
 * The signup placed at the end of an essay or field note — carries the source
 * + slug so we know where a subscriber came from.
 */
export default function EssaySignup({
  slug,
  type,
}: {
  slug?: string;
  type: "essay" | "field_note";
}) {
  return (
    <NewsletterSignup
      source={type === "essay" ? "essay_footer" : "fieldnote_footer"}
      contentSlug={slug}
      contentType={type}
      heading={type === "essay" ? "Get the next essay" : "Get the next dispatch"}
    />
  );
}
