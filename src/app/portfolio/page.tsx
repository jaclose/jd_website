import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Portfolio",
  description:
    "Projects and work by Jafar Dabbagh — web development, software, and more.",
};

type Project = {
  title: string;
  description: string;
  tags: string[];
  liveUrl?: string;
  githubUrl?: string;
  featured?: boolean;
};

const projects: Project[] = [
  {
    title: "Project One",
    description:
      "A detailed description of this project — what problem it solves, your role in building it, key technical decisions, and the impact or outcome. Be specific.",
    tags: ["React", "Node.js", "PostgreSQL", "Deployed on Vercel"],
    liveUrl: "#",
    githubUrl: "#",
    featured: true,
  },
  {
    title: "Project Two",
    description:
      "Another project description. Mention the scale (users, traffic, data), the challenges you overcame, and what you're most proud of.",
    tags: ["Next.js", "TypeScript", "Tailwind CSS"],
    liveUrl: "#",
    githubUrl: "#",
    featured: true,
  },
  {
    title: "Project Three",
    description:
      "Third project. Even side projects or experiments are worth including — they show curiosity and range.",
    tags: ["Python", "FastAPI", "ML", "OpenAI"],
    githubUrl: "#",
  },
  {
    title: "Project Four",
    description:
      "Keep adding projects here. Each entry should give the reader a clear picture of your capabilities.",
    tags: ["Vue.js", "Firebase", "PWA"],
    liveUrl: "#",
  },
  {
    title: "Project Five",
    description:
      "Older or smaller projects can still demonstrate breadth — different domains, languages, or industries.",
    tags: ["React Native", "iOS", "Android"],
    githubUrl: "#",
  },
  {
    title: "Open Source Contribution",
    description:
      "Contributions to open source repos show you can work in existing codebases and collaborate with distributed teams.",
    tags: ["Open Source", "TypeScript"],
    githubUrl: "#",
  },
];

function ExternalLinkIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
      />
    </svg>
  );
}

function GitHubIcon() {
  return (
    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
    </svg>
  );
}

export default function PortfolioPage() {
  const featured = projects.filter((p) => p.featured);
  const rest = projects.filter((p) => !p.featured);

  return (
    <div className="px-6 py-20">
      <div className="mx-auto max-w-5xl">
        {/* Header */}
        <div className="mb-16">
          <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl">
            Portfolio
          </h1>
          <p className="mt-4 max-w-2xl text-slate-400">
            A selection of projects I&apos;ve designed, built, or contributed
            to. From side projects to production applications.
          </p>
        </div>

        {/* Featured */}
        {featured.length > 0 && (
          <section className="mb-16">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-indigo-400 mb-6">
              Featured
            </h2>
            <div className="grid gap-6 lg:grid-cols-2">
              {featured.map((project) => (
                <div
                  key={project.title}
                  className="rounded-xl border border-indigo-500/30 bg-gradient-to-br from-indigo-950/40 to-slate-800/30 p-7"
                >
                  <h3 className="text-lg font-semibold text-white">
                    {project.title}
                  </h3>
                  <p className="mt-2 text-sm text-slate-300 leading-relaxed">
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
                  <div className="mt-5 flex gap-4">
                    {project.liveUrl && (
                      <a
                        href={project.liveUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 text-sm text-indigo-400 hover:text-indigo-300 transition-colors"
                      >
                        <ExternalLinkIcon />
                        Live site
                      </a>
                    )}
                    {project.githubUrl && (
                      <a
                        href={project.githubUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-300 transition-colors"
                      >
                        <GitHubIcon />
                        Source
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* All projects */}
        <section>
          <h2 className="text-xs font-semibold uppercase tracking-widest text-indigo-400 mb-6">
            All Projects
          </h2>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {rest.map((project) => (
              <div
                key={project.title}
                className="rounded-xl border border-slate-700/50 bg-slate-800/20 p-6 hover:border-slate-600/60 transition-colors"
              >
                <h3 className="font-semibold text-white">{project.title}</h3>
                <p className="mt-2 text-sm text-slate-400 leading-relaxed">
                  {project.description}
                </p>
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {project.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full bg-slate-700/50 px-2.5 py-0.5 text-xs text-slate-400"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
                <div className="mt-4 flex gap-4">
                  {project.liveUrl && (
                    <a
                      href={project.liveUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
                    >
                      <ExternalLinkIcon />
                      Live
                    </a>
                  )}
                  {project.githubUrl && (
                    <a
                      href={project.githubUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-300 transition-colors"
                    >
                      <GitHubIcon />
                      Code
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
