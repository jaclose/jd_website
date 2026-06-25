import Image from "next/image";
import Link from "next/link";
import { bodies } from "@/data/system";

const MOBILE_LABELS: Record<string, string> = {
  essays: "Ess",
  "field-notes": "Notes",
  garden: "San",
  about: "Bio",
};

/**
 * Header for subpages — the DabbaghMed mark beside the name, then a quiet
 * echo of the docked system. Each section keeps its planetary color as a
 * small body beside its name.
 */
export default function SiteHeader({ current }: { current?: string }) {
  const links = bodies.filter((b) => !b.href.startsWith("/#"));
  return (
    <header className="fixed inset-x-0 top-0 z-30 border-b border-[rgba(232,230,225,0.1)] bg-[rgba(5,6,10,0.78)] backdrop-blur-md">
      <nav className="mx-auto flex h-15 max-w-6xl items-center justify-between gap-3 px-3 sm:px-6 md:px-10">
        <Link
          href="/"
          aria-label="Home"
          className="group flex shrink-0 items-center gap-3 font-display text-[0.95rem] tracking-[0.08em] text-ink transition-colors hover:text-starlight"
        >
          <Image
            src="/brand/mark.png"
            alt=""
            width={28}
            height={28}
            priority
            className="h-7 w-7 transition-transform duration-500 group-hover:rotate-[14deg]"
          />
          <span className="hidden lg:inline">DabbaghMed</span>
        </Link>
        <div className="flex min-w-0 items-center justify-end gap-1.5 sm:gap-5 md:gap-8">
          {links.map((b) => (
            <Link
              key={b.id}
              href={b.href}
              aria-label={b.name}
              aria-current={current === b.id ? "page" : undefined}
              className={`group -my-2 items-center gap-1.5 px-1 py-2 sm:my-0 sm:gap-2 sm:px-0 sm:py-0 ${
                b.id === "achievements" || b.id === "vault" || b.id === "about" ? "hidden md:flex" : "flex"
              } ${
                current === b.id ? "opacity-100" : "opacity-70"
              } transition-opacity hover:opacity-100`}
            >
              <span
                aria-hidden
                className="h-1.5 w-1.5 shrink-0 rounded-full transition-transform duration-300 group-hover:scale-150"
                style={{ background: b.color }}
              />
              <span className={`label whitespace-nowrap text-[7.5px]! tracking-[0.14em]! sm:hidden ${current === b.id ? "" : "max-[430px]:hidden"}`}>
                {MOBILE_LABELS[b.id] ?? b.name}
              </span>
              <span className="label hidden text-[9px]! sm:inline">{b.name}</span>
            </Link>
          ))}
        </div>
      </nav>
    </header>
  );
}
