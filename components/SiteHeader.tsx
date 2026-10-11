"use client";
import { useRef } from "react";
import Image from "next/image";
import Link from "next/link";

const links = [
  ["essays", "Essays", "/essays"], ["field-notes", "Field Notes", "/field-notes"],
  ["garden", "Sanctum", "/garden"], ["projects", "Projects", "/#deployments"],
  ["about", "About", "/about"], ["newsletter", "Letters", "/newsletter"],
];
export default function SiteHeader({ current }: { current?: string }) {
  const menu = useRef<HTMLDetailsElement>(null);
  return <header className="site-header"><nav aria-label="Primary">
    <Link href="/" aria-label="Jafar Dabbagh — home" className="site-wordmark"><Image src="/brand/mark.png" alt="" width={28} height={28} /><span>JD-1184</span></Link>
    <div className="site-links">{links.map(([id, label, href]) => <Link key={id} href={href} aria-current={current === id ? "page" : undefined}>{label}</Link>)}</div>
    <details ref={menu} className="mobile-menu" onClick={event => { if ((event.target as HTMLElement).closest("a")) menu.current?.removeAttribute("open"); }} onKeyDown={event => { if (event.key === "Escape") { menu.current?.removeAttribute("open"); menu.current?.querySelector("summary")?.focus(); } }}><summary>Explore <span aria-hidden>+</span></summary><div>{links.map(([id, label, href]) => <Link key={id} href={href} aria-current={current === id ? "page" : undefined}>{label} <span aria-hidden>↗</span></Link>)}<Link href="/vault">The Vault <span aria-hidden>↗</span></Link></div></details>
  </nav></header>;
}
