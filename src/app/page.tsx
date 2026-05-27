import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Jafar Dabbagh",
  description:
    "Personal site of Jafar Dabbagh — portfolio, writing, and contact.",
};

const featuredProjects = [
  {
    title: "Project One",
    description:
      "A brief description of what this project does and why it matters. Highlight the problem solved and tech used.",
    tags: ["React", "Node.js", "PostgreSQL"],
    href: "/portfolio",
  },
  {
    title: "Project Two",
    description:
      "Another impactful project. Describe the outcome, your role, and anything unique about your approach.",
    tags: ["Next.js", "TypeScript", "Tailwind"],
    href: "/portfolio",
  },
  {
    title: "Project Three",
    description:
      "A third highlight. Keep it results-oriented — what did you build, and what was the impact?",
    tags: ["Python", "ML", "API"],
    href: "/portfolio",
  },
];

const recentPosts = [
  {
    title: "Your First Blog Post Title Here",
    date: "May 2025",
    excerpt:
      "A short preview of what this article covers. Readers should get a sense of the value they'll get from clicking through.",
    href: "/blog",
  },
  {
    title: "Second Article — Update This Title",
    date: "April 2025",
    excerpt:
      "Another preview. Good blog previews surface the key insight or question the article addresses.",
    href: "/blog",
  },
];

export default function HomePage() {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden px-6 py-28 sm:py-36">
        <div className="absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-950 via-slate-950 to-slate-950" />
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-indigo-600/10 rounded-full blur-3xl" />
        </div>
        <div className="mx-auto max-w-5xl">
          <p className="mb-4 inline-block rounded-full border border-indigo-500/30 bg-indigo-500/10 px-4 py-1.5 text-xs font-medium tracking-widest text-indigo-300 uppercase">
            Welcome
          </p>
          <h1 className="text-5xl font-bold tracking-tight text-white sm:text-7xl">
            Hi, I&apos;m{" "}
            <span className="bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">
              Jafar Dabbagh
            </span>
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-slate-300 leading-relaxed sm:text-xl">
            [Update this tagline] — Builder, thinker, and writer. I work on
            things I care about and share what I learn along the way.
          </p>
          <div className="mt-10 flex flex-wrap gap-4">
            <Link
              href="/portfolio"
              className="rounded-lg bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/20 hover:bg-indigo-500 transition-colors"
            >
              View My Work
            </Link>
            <Link
              href="/contact"
              className="rounded-lg border border-slate-600 bg-slate-800/50 px-6 py-3 text-sm font-semibold text-slate-200 hover:border-indigo-500/50 hover:bg-slate-700/50 transition-colors"
            >
              Get in Touch
            </Link>
          </div>
        </div>
      </section>

      {/* About snippet */}
      <section className="px-6 py-20">
        <div className="mx-auto max-w-5xl">
          <div className="grid gap-12 lg:grid-cols-2 lg:gap-20 items-center">
            <div>
              <h2 className="text-3xl font-bold tracking-tight text-white">
                About Me
              </h2>
              <p className="mt-4 text-slate-300 leading-relaxed">
                [Replace this with a short bio — 2–3 sentences about who you
                are, what you do, and what drives you. This is the first thing
                visitors read after the hero.]
              </p>
              <p className="mt-4 text-slate-300 leading-relaxed">
                [Add a second paragraph if you like — experience, background,
                current focus, or what you&apos;re working on next.]
              </p>
              <Link
                href="/about"
                className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-indigo-400 hover:text-indigo-300 transition-colors"
              >
                Read more about me
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: "Years of experience", value: "—" },
                { label: "Projects shipped", value: "—" },
                { label: "Blog posts written", value: "—" },
                { label: "Cups of coffee", value: "∞" },
              ].map(({ label, value }) => (
                <div
                  key={label}
                  className="rounded-xl border border-slate-700/50 bg-slate-800/30 p-6"
                >
                  <p className="text-3xl font-bold text-indigo-400">{value}</p>
                  <p className="mt-1 text-sm text-slate-400">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Featured projects */}
      <section className="px-6 py-20 bg-slate-900/40">
        <div className="mx-auto max-w-5xl">
          <div className="flex items-end justify-between mb-10">
            <div>
              <h2 className="text-3xl font-bold tracking-tight text-white">
                Featured Work
              </h2>
              <p className="mt-2 text-slate-400">
                A selection of projects I&apos;ve built or contributed to.
              </p>
            </div>
            <Link
              href="/portfolio"
              className="hidden sm:inline-flex items-center gap-2 text-sm text-indigo-400 hover:text-indigo-300 transition-colors"
            >
              View all
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {featuredProjects.map((project) => (
              <Link
                key={project.title}
                href={project.href}
                className="group relative rounded-xl border border-slate-700/50 bg-slate-800/30 p-6 hover:border-indigo-500/50 hover:bg-slate-800/60 transition-all"
              >
                <h3 className="font-semibold text-white group-hover:text-indigo-300 transition-colors">
                  {project.title}
                </h3>
                <p className="mt-2 text-sm text-slate-400 leading-relaxed">
                  {project.description}
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {project.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full bg-indigo-500/10 border border-indigo-500/20 px-2.5 py-0.5 text-xs text-indigo-300"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </Link>
            ))}
          </div>
          <div className="mt-6 sm:hidden">
            <Link
              href="/portfolio"
              className="text-sm text-indigo-400 hover:text-indigo-300 transition-colors"
            >
              View all projects →
            </Link>
          </div>
        </div>
      </section>

      {/* Recent posts */}
      <section className="px-6 py-20">
        <div className="mx-auto max-w-5xl">
          <div className="flex items-end justify-between mb-10">
            <div>
              <h2 className="text-3xl font-bold tracking-tight text-white">
                Recent Writing
              </h2>
              <p className="mt-2 text-slate-400">
                Thoughts on technology, design, and building things.
              </p>
            </div>
            <Link
              href="/blog"
              className="hidden sm:inline-flex items-center gap-2 text-sm text-indigo-400 hover:text-indigo-300 transition-colors"
            >
              All posts
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
          <div className="flex flex-col gap-6">
            {recentPosts.map((post) => (
              <Link
                key={post.title}
                href={post.href}
                className="group flex flex-col sm:flex-row gap-4 sm:gap-8 rounded-xl border border-slate-700/50 bg-slate-800/20 p-6 hover:border-indigo-500/40 hover:bg-slate-800/40 transition-all"
              >
                <time className="shrink-0 text-sm text-slate-500 sm:w-24">
                  {post.date}
                </time>
                <div>
                  <h3 className="font-semibold text-white group-hover:text-indigo-300 transition-colors">
                    {post.title}
                  </h3>
                  <p className="mt-1 text-sm text-slate-400">{post.excerpt}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 py-20 bg-gradient-to-b from-transparent to-indigo-950/30">
        <div className="mx-auto max-w-5xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-white">
            Let&apos;s work together
          </h2>
          <p className="mt-4 text-slate-300 max-w-lg mx-auto">
            Have a project in mind, a question, or just want to say hello? I'd
            love to hear from you.
          </p>
          <Link
            href="/contact"
            className="mt-8 inline-block rounded-lg bg-indigo-600 px-8 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/20 hover:bg-indigo-500 transition-colors"
          >
            Get in Touch
          </Link>
        </div>
      </section>
    </>
  );
}
