import type { Metadata } from "next";

/**
 * Canonical site origin. Google has indexed both www and non-www; everything
 * here resolves to the single www host so canonicals/OG/sitemap stay consistent.
 * Set Vercel's primary domain to www so non-www 301s here.
 */
export const SITE_URL = "https://www.jafardabbagh.com";

/** absolute URL from a site-relative path */
export function abs(path: string): string {
  return path.startsWith("http") ? path : `${SITE_URL}${path.startsWith("/") ? "" : "/"}${path}`;
}

/** the site-wide share card rendered by app/opengraph-image.tsx */
export const SHARE_IMAGE = { url: "/opengraph-image", width: 1200, height: 630, alt: "Jafar Dabbagh — JD-1184, essays, field notes, and the Sanctum" };

/**
 * Page metadata with matching Open Graph + Twitter cards. Without this, a
 * page's own title only reaches the tab: shares fall back to the root
 * layout's generic "Jafar Dabbagh | JD-1184" card. Overriding openGraph
 * replaces the layout's whole block, so the share image is restated here.
 */
export function pageMetadata({ title, description, path }: { title: string; description: string; path: string }): Metadata {
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      type: "website",
      siteName: "Jafar Dabbagh",
      locale: "en_US",
      url: abs(path),
      title,
      description,
      images: [SHARE_IMAGE],
    },
    twitter: { card: "summary_large_image", title, description, images: [SHARE_IMAGE] },
  };
}

const PERSON = {
  "@type": "Person",
  name: "Jafar Dabbagh",
  url: SITE_URL,
  image: abs("/brand/avatar.png"),
  jobTitle: "Medical Student",
  description:
    "Writer and medical student — essays and field notes on study, faith, and endurance.",
  sameAs: [
    "https://www.linkedin.com/in/jafardabbagh/",
    "https://github.com/jaclose",
  ],
} as const;

/** Person schema for the homepage — binds the "jafar dabbagh" query to this site */
export const personJsonLd = {
  "@context": "https://schema.org",
  ...PERSON,
};

/** WebSite schema for the homepage */
export const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "Jafar Dabbagh",
  url: SITE_URL,
};

/** BlogPosting schema for a single essay */
export function essayJsonLd(opts: {
  slug: string;
  title: string;
  date: string;
  description: string;
  image?: string;
}) {
  const url = abs(`/essays/${opts.slug}`);
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: opts.title,
    description: opts.description,
    datePublished: opts.date,
    dateModified: opts.date,
    author: { "@type": "Person", name: "Jafar Dabbagh", url: SITE_URL },
    publisher: { "@type": "Person", name: "Jafar Dabbagh", url: SITE_URL },
    image: abs(opts.image ?? "/opengraph-image"),
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    url,
  };
}
