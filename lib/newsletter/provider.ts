import { resendRequest } from "@/lib/resend/request";
import type { Resend } from "resend";
import { NEWSLETTER_CHOICES, type NewsletterPreference } from "./preferences";
import type { NewsletterProvider } from "./subscription";

export type NewsletterChannel = { segmentId: string; topicId: string };
export type NewsletterChannels = Record<NewsletterPreference, NewsletterChannel>;
const errorCode = (error: { statusCode?: number | null } | null) => error?.statusCode;
function requireSuccess(result: { error: { message: string } | null }) {
  if (result.error) throw new Error("Email provider unavailable");
}

export function createNewsletterProvider(client: Resend, from: string, channels: NewsletterChannels): NewsletterProvider {
  return {
    async sendLink(email, url, idempotencyKey) {
      const subject = "Confirm your email preferences — Jafar Dabbagh";
      const text = `Choose what reaches you from JD-1184. Open this link, review your choices, and confirm:\n\n${url}\n\nThis link expires in 30 minutes and can be used once. You have not been subscribed by this email. If you did not request it, ignore it.\n\nJafar Dabbagh`;
      const html = `<body style="background:#06070b;color:#e8e6e1;padding:32px;font-family:Georgia,serif"><div style="max-width:540px;margin:auto"><p style="color:#d4b886;letter-spacing:2px;font-family:monospace">JAFAR DABBAGH · JD-1184</p><h1 style="font-weight:400">A letter, by invitation.</h1><p style="font-size:18px;line-height:1.6">Review your choices and confirm your email preferences.</p><p><a style="color:#d4b886" href="${url}">Review and confirm →</a></p><p style="color:#b7bac0;line-height:1.6">This link expires in 30 minutes and can be used once. You have not been subscribed by this email. If you did not request it, ignore it.</p></div></body>`;
      requireSuccess(await resendRequest(() => client.emails.send({ from, to: email, subject, html, text }, { idempotencyKey })));
    },
    async preferences(email) {
      const contact = await resendRequest(() => client.contacts.get({ email: encodeURIComponent(email) }));
      if (errorCode(contact.error) === 404) return [];
      requireSuccess(contact);
      if (!contact.data || contact.data.unsubscribed) return [];
      const result: NewsletterPreference[] = [];
      let after: string | undefined;
      do {
        const topics = await resendRequest(() => client.contacts.topics.list({ email: encodeURIComponent(email), limit: 100, ...(after ? { after } : {}) }));
        requireSuccess(topics);
        for (const choice of NEWSLETTER_CHOICES) {
          if (topics.data?.data.some(t => t.id === channels[choice.id].topicId && t.subscription === "opt_in")) result.push(choice.id);
        }
        after = topics.data?.has_more ? topics.data.data[topics.data.data.length - 1]?.id : undefined;
      } while (after);
      return result;
    },
    async save(email, preferences) {
      const contact = await resendRequest(() => client.contacts.get({ email: encodeURIComponent(email) }));
      if (contact.error && errorCode(contact.error) !== 404) requireSuccess(contact);
      const topics = NEWSLETTER_CHOICES.map(({ id }) => ({ id: channels[id].topicId, subscription: preferences.includes(id) ? "opt_in" as const : "opt_out" as const }));
      if (!contact.data) {
        if (!preferences.length) return;
        // Topic consent and membership are created in the same provider request.
        requireSuccess(await resendRequest(() => client.contacts.create({ email, unsubscribed: false, topics, segments: preferences.map(id => ({ id: channels[id].segmentId })) })));
        return;
      }
      // Set all three topic choices first. Broadcasts require these topics, so
      // a failed segment update cannot re-enable a category the reader declined.
      requireSuccess(await resendRequest(() => client.contacts.topics.update({ email: encodeURIComponent(email), topics })));
      for (const { id } of NEWSLETTER_CHOICES) {
        const payload = { email: encodeURIComponent(email), segmentId: channels[id].segmentId };
        const response = preferences.includes(id) ? await resendRequest(() => client.contacts.segments.add(payload)) : await resendRequest(() => client.contacts.segments.remove(payload));
        if (response.error && !(preferences.includes(id) ? errorCode(response.error) === 409 : errorCode(response.error) === 404)) requireSuccess(response);
      }
      if (preferences.length && contact.data.unsubscribed) requireSuccess(await resendRequest(() => client.contacts.update({ email: encodeURIComponent(email), unsubscribed: false })));
    },
  };
}
