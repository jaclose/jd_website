import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Blog",
  description:
    "Writing by Jafar Dabbagh on technology, design, software, and ideas.",
};

type Post = {
  title: string;
  slug: string;
  date: string;
  readTime: string;
  excerpt: string;
  tags: string[];
};

const posts: Post[] = [
  {
    title: "Your First Blog Post Title",
    slug: "first-post",
    date: "May 20, 2025",
    readTime: "5 min read",
    excerpt:
      "Replace this with a compelling excerpt — one or two sentences that make the reader want to click through. What's the key insight or argument of the post?",
    tags: ["Technology", "Web"],
  },
  {
    title: "Second Article — Update This",
    slug: "second-post",
    date: "April 15, 2025",
    readTime: "8 min read",
    excerpt:
      "Another post excerpt here. Good previews reveal enough to hook the reader without spoiling everything.",
    tags: ["Design", "UX"],
  },
  {
    title: "Third Post Title Goes Here",
    slug: "third-post",
    date: "March 8, 2025",
    readTime: "4 min read",
    excerpt:
      "A third article preview. You can have posts on any topic — tutorials, opinion pieces, case studies, or lessons learned.",
    tags: ["Tutorial", "JavaScript"],
  },
  {
    title: "Another Article — Fill In",
    slug: "fourth-post",
    date: "February 2, 2025",
    readTime: "6 min read",
    excerpt:
      "Add as many posts as you like. Each one builds your credibility and helps with SEO for your domain.",
    tags: ["Career", "Reflections"],
  },
];

const allTags = [...new Set(posts.flatMap((p) => p.tags))];

export default function BlogPage() {
  return (
    <div className="px-6 py-20">
      <div className="mx-auto max-w-3xl">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl">
            Blog
          </h1>
          <p className="mt-4 text-slate-400">
            Writing on technology, software, design, and whatever I&apos;m
            thinking about.
          </p>
        </div>

        {/* Tags */}
        <div className="mb-10 flex flex-wrap gap-2">
          <span className="rounded-full bg-indigo-600 px-3 py-1 text-xs font-medium text-white">
            All
          </span>
          {allTags.map((tag) => (
            <span
              key={tag}
              className="rounded-full border border-slate-700 bg-slate-800/40 px-3 py-1 text-xs font-medium text-slate-400 cursor-pointer hover:border-indigo-500/50 hover:text-indigo-400 transition-colors"
            >
              {tag}
            </span>
          ))}
        </div>

        {/* Posts */}
        <div className="flex flex-col divide-y divide-slate-700/50">
          {posts.map((post) => (
            <article key={post.slug} className="py-8 first:pt-0">
              <div className="flex items-center gap-3 mb-3">
                <time className="text-xs text-slate-500">{post.date}</time>
                <span className="text-slate-700">·</span>
                <span className="text-xs text-slate-500">{post.readTime}</span>
                {post.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full bg-slate-800/60 border border-slate-700/60 px-2.5 py-0.5 text-xs text-slate-400"
                  >
                    {tag}
                  </span>
                ))}
              </div>
              <h2 className="text-xl font-semibold text-white hover:text-indigo-300 transition-colors">
                <Link href={`/blog/${post.slug}`}>{post.title}</Link>
              </h2>
              <p className="mt-2 text-sm text-slate-400 leading-relaxed">
                {post.excerpt}
              </p>
              <Link
                href={`/blog/${post.slug}`}
                className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-indigo-400 hover:text-indigo-300 transition-colors"
              >
                Read more
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}
