import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";

export default function NotFound() {
  return (
    <>
      <SiteHeader />
      <main className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
        <p className="label mb-6 text-dim">ERR 404 · BEYOND THE HELIOPAUSE</p>
        <h1 className="font-display text-[clamp(2.6rem,8vw,5.5rem)] font-light leading-none text-ink">
          Signal lost
        </h1>
        <p className="mt-6 max-w-md font-serif text-xl italic leading-relaxed text-faint">
          Whatever orbited here has drifted past the edge of the charted
          system. The sun, at least, is always where you left it.
        </p>
        <Link
          href="/"
          className="label mt-10 inline-flex items-center gap-3 !text-[11px] !tracking-[0.3em] text-starlight transition-colors hover:text-ink"
        >
          ⟵ RETURN TO JD-1184
        </Link>
      </main>
    </>
  );
}
