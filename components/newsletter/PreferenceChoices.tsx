"use client";
import { NEWSLETTER_CHOICES, type NewsletterPreference } from "@/lib/newsletter/preferences";
export default function PreferenceChoices({ value, onChange, disabled = false }: {
  value: NewsletterPreference[]; onChange: (value: NewsletterPreference[]) => void; disabled?: boolean;
}) {
  return <fieldset className="newsletter-choices" disabled={disabled}><legend>Choose your letters</legend>
    {NEWSLETTER_CHOICES.map(choice => <label key={choice.id}><input type="checkbox" name="preferences" value={choice.id} checked={value.includes(choice.id)} onChange={e => onChange(e.target.checked ? [...value, choice.id] : value.filter(v => v !== choice.id))} /><span><strong>{choice.label}</strong><small>{choice.detail}</small></span></label>)}
    <p className="newsletter-cadence-note">Essays, field notes, and project updates arrive when published. Weekly and monthly letters are separate roundups; choose either for a quieter inbox.</p>
  </fieldset>;
}
