import Link from "next/link";
import { bodies } from "@/data/system";

/**
 * Header for subpages — a quiet echo of the docked system. Each section
 * keeps its planetary color as a small body beside its name.
 */
export default function SiteHeader({ current }: { current?: string }) {
  const links = bodies.filter((b) => !b.href.startsWith("/#"));
  return (
    <header className="fixed inset-x-0 top-0 z-30 border-b border-[rgba(232,230,225,0.1)] bg-[rgba(5,6,10,0.78)] backdrop-blur-md">
      <nav className="mx-auto flex h-[60px] max-w-6xl items-center justify-between px-6 md:px-10">
        <Link
          href="/"
          className="flex items-center gap-3 font-display text-[0.95rem] tracking-[0.08em] text-ink transition-colors hover:text-starlight"
        >
          <span
            aria-hidden
            className="h-2.5 w-2.5 rounded-full bg-[#ffe3ad] shadow-[0_0_12px_2px_rgba(244,200,124,0.6)]"
          />
          Jafar Dabbagh
        </Link>
        <div className="flex items-center gap-5 md:gap-8">
          {links.map((b) => (
            <Link
              key={b.id}
              href={b.href}
              className={`group flex items-center gap-2 ${
                current === b.id ? "opacity-100" : "opacity-70"
              } transition-opacity hover:opacity-100`}
            >
              <span
                aria-hidden
                className="h-1.5 w-1.5 rounded-full transition-transform duration-300 group-hover:scale-150"
                style={{ background: b.color }}
              />
              <span className="label !text-[9px]">{b.name}</span>
            </Link>
          ))}
        </div>
      </nav>
    </header>
  );
}
