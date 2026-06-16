/**
 * Renders a JSON-LD <script> in the server-rendered HTML so crawlers see the
 * structured data without running JS. Server component — no "use client".
 */
export default function JsonLd({ data }: { data: object }) {
  return (
    <script
      type="application/ld+json"
      // schema is our own static data, not user input
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
