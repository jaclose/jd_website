import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "About",
  description:
    "Learn more about Jafar Dabbagh — background, skills, and experience.",
};

const skills = [
  "JavaScript / TypeScript",
  "React / Next.js",
  "Node.js",
  "Python",
  "SQL / PostgreSQL",
  "REST APIs",
  "Cloud / Vercel",
  "Git / GitHub",
];

const experience = [
  {
    role: "Role Title",
    company: "Company Name",
    period: "20XX – Present",
    description:
      "Describe what you did here — responsibilities, achievements, and technologies. Keep it concise and results-oriented.",
  },
  {
    role: "Previous Role",
    company: "Previous Company",
    period: "20XX – 20XX",
    description:
      "Another position. Focus on impact: what you built, what improved, what you learned.",
  },
  {
    role: "Earlier Role",
    company: "Earlier Company",
    period: "20XX – 20XX",
    description:
      "Earlier in your career. Even short stints can highlight growth or pivotal skills.",
  },
];

export default function AboutPage() {
  return (
    <div className="px-6 py-20">
      <div className="mx-auto max-w-3xl">
        {/* Header */}
        <div className="mb-16">
          <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl">
            About Me
          </h1>
          <p className="mt-4 text-slate-400">
            A bit about who I am, what I do, and how I got here.
          </p>
        </div>

        {/* Bio */}
        <section className="mb-16">
          <div className="prose prose-invert prose-slate max-w-none">
            <p className="text-lg text-slate-300 leading-relaxed">
              [Replace this with your bio — first paragraph. Introduce
              yourself, your field, and what you care about most in your work.]
            </p>
            <p className="mt-4 text-slate-300 leading-relaxed">
              [Second paragraph — background story, how you got into this, or
              what shaped your approach. Be personal; readers connect with
              people, not credentials.]
            </p>
            <p className="mt-4 text-slate-300 leading-relaxed">
              [Third paragraph — current focus. What are you building right
              now? What problems excite you? What&apos;s next?]
            </p>
          </div>
          <div className="mt-8 flex gap-4">
            <Link
              href="/contact"
              className="rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500 transition-colors"
            >
              Get in touch
            </Link>
            <Link
              href="/portfolio"
              className="rounded-lg border border-slate-600 bg-slate-800/50 px-5 py-2.5 text-sm font-semibold text-slate-200 hover:border-indigo-500/50 transition-colors"
            >
              View my work
            </Link>
          </div>
        </section>

        {/* Skills */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-white mb-6">Skills &amp; Tools</h2>
          <div className="flex flex-wrap gap-3">
            {skills.map((skill) => (
              <span
                key={skill}
                className="rounded-lg border border-slate-700/60 bg-slate-800/40 px-4 py-2 text-sm text-slate-300"
              >
                {skill}
              </span>
            ))}
          </div>
        </section>

        {/* Experience */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-white mb-8">Experience</h2>
          <div className="relative border-l border-slate-700/60 pl-8 space-y-10">
            {experience.map((item, i) => (
              <div key={i} className="relative">
                <div className="absolute -left-[41px] top-1 w-4 h-4 rounded-full border-2 border-indigo-500 bg-slate-950" />
                <time className="text-xs font-medium text-indigo-400 tracking-wide uppercase">
                  {item.period}
                </time>
                <h3 className="mt-1 font-semibold text-white">{item.role}</h3>
                <p className="text-sm text-slate-400">{item.company}</p>
                <p className="mt-2 text-sm text-slate-300 leading-relaxed">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Education placeholder */}
        <section>
          <h2 className="text-2xl font-bold text-white mb-6">Education</h2>
          <div className="rounded-xl border border-slate-700/50 bg-slate-800/20 p-6">
            <p className="font-semibold text-white">Degree &amp; Major</p>
            <p className="text-sm text-slate-400">University Name · Year</p>
            <p className="mt-2 text-sm text-slate-300">
              [Optional: add a note about your studies, thesis, or anything
              relevant to your work.]
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
