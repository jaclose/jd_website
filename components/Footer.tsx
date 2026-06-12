import Image from "next/image";
import Link from "next/link";

export default function Footer() {
  return (
    <footer className="relative z-10 border-t border-[rgba(232,230,225,0.1)]">
      <div className="mx-auto flex max-w-6xl flex-col gap-10 px-6 py-16 md:flex-row md:items-end md:justify-between md:px-10">
        <div>
          <div className="flex items-center gap-4">
            <Image
              src="/brand/mark.png"
              alt="DabbaghMed"
              width={44}
              height={44}
              className="h-11 w-11"
            />
            <div>
              <p className="font-display text-2xl font-light text-ink">Jafar Dabbagh</p>
              <p className="font-serif text-sm italic text-faint">
                Chasing truth in struggle and stillness.
              </p>
            </div>
          </div>
          <p className="label mt-5 text-[9px]! text-dim">
            JD-1184 SYSTEM · EST. 2025 · TERRAFORMING IN PROGRESS
          </p>
        </div>
        <nav className="flex flex-wrap gap-x-8 gap-y-3">
          {[
            ["Essays", "/essays"],
            ["Field Notes", "/field-notes"],
            ["The Garden", "/garden"],
            ["The Archive", "/#archive"],
            ["The Vault", "/vault"],
            ["About", "/about"],
          ].map(([label, href]) => (
            <Link key={href} href={href} className="label link-reveal text-[10px]! text-faint hover:text-ink">
              {label}
            </Link>
          ))}
          <a
            href="mailto:jafardabbagh@gmail.com"
            className="label link-reveal text-[10px]! text-starlight/80 hover:text-starlight"
          >
            Transmit a signal
          </a>
        </nav>
      </div>
      <div className="border-t border-[rgba(232,230,225,0.06)] py-5 text-center">
        <p className="label text-[8px]! text-dim">
          © {new Date().getFullYear()} JAFAR DABBAGH — DABBAGHMED · BUILT BY HAND · DEPLOYED FROM EARTH VIA VERCEL
        </p>
      </div>
    </footer>
  );
}
