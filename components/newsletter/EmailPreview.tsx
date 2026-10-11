"use client";
import { useState } from "react";
import { SITE_URL } from "@/lib/seo";
export default function EmailPreview({ examples }: { examples: { label: string; subject: string; html: string }[] }) {
  const [selected, setSelected] = useState(0);
  const example = examples[selected];
  // Preview this deployment's assets; actual emails retain absolute canonical URLs.
  const preview = example.html.replaceAll(`src="${SITE_URL}/`, 'src="/').replaceAll(`href="${SITE_URL}/`, 'href="/').replaceAll('href="{{{RESEND_UNSUBSCRIBE_URL}}}"', 'href="/newsletter#preferences"').replaceAll('<a ', '<a target="_blank" rel="noopener noreferrer" ');
  return <section className="email-preview"><div className="quest-tabs" role="group" aria-label="Choose an email preview">{examples.map((e,i) => <button type="button" key={e.label} aria-pressed={i === selected} onClick={() => setSelected(i)}>{e.label}</button>)}</div><p className="email-preview-subject"><span className="label">Subject</span> {example.subject}</p><iframe key={example.label} title={`${example.label} email example`} srcDoc={preview} sandbox="allow-popups allow-popups-to-escape-sandbox" referrerPolicy="no-referrer" /><p className="journal-hint">An example using the existing archive. Automatic letters include only new work from their period. Links open in a new tab; preference links become personal links in the email you receive.</p></section>;
}
