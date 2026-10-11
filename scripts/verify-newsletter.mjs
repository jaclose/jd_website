/** Exercises the built Next app with a real local Postgres engine and a local Resend simulator.
 * No real email, credentials, contacts, or remote database are used.
 */
import { PGlite } from '@electric-sql/pglite';
import { createServer } from 'node:http';
import { readFileSync } from 'node:fs';
import { spawn } from 'node:child_process';
import assert from 'node:assert/strict';
import { chromium } from 'playwright-core';

const db = new PGlite();
await db.exec('create role anon; create role authenticated; create role service_role bypassrls;');
await db.exec(readFileSync(new URL('../supabase/migrations/20261011125729_newsletter_confirmations.sql', import.meta.url), 'utf8'));
await db.exec(readFileSync(new URL('../supabase/migrations/20261011170000_newsletter_digest_preferences.sql', import.meta.url), 'utf8'));
const contacts = new Map(); const messages = []; let emailUnavailable = false;
const server = createServer(async (req, res) => {
  res.setHeader('content-type', 'application/json');
  const reply = (data, status = 200) => { res.statusCode = status; res.end(JSON.stringify(data)); };
  try {
    const chunks = []; for await (const c of req) chunks.push(c);
    const raw = Buffer.concat(chunks).toString(); const body = raw ? JSON.parse(raw) : {};
    const url = new URL(req.url, 'http://localhost');
    if (url.pathname.endsWith('/rpc/newsletter_issue')) {
      const q = await db.query('select newsletter_issue($1,$2,$3,$4,$5) as ok', [body.p_token_hash, body.p_email, body.p_preferences, body.p_intent, body.p_ip_hash]); return reply(q.rows[0].ok);
    }
    if (url.pathname.endsWith('/rpc/newsletter_consume')) return reply((await db.query('select * from newsletter_consume($1)', [body.p_token_hash])).rows);
    if (url.pathname === '/rest/v1/newsletter_requests') {
      const hash = url.searchParams.get('token_hash')?.slice(3);
      const rows = (await db.query('select * from newsletter_requests where token_hash=$1 and used_at is null and expires_at>now()', [hash])).rows;
      return reply(rows); // supabase-js maybeSingle requests an array then normalizes it
    }
    if (url.pathname === '/emails') {
      if (emailUnavailable) return reply({ statusCode: 503, name: 'application_error', message: 'simulated provider failure' }, 503);
      messages.push(body); return reply({ id: `email-${messages.length}` });
    }
    if (url.pathname === '/contacts' && req.method === 'POST') { contacts.set(body.email, { id: 'c1', ...body }); return reply({ id: 'c1' }); }
    const parts = decodeURIComponent(url.pathname).split('/'); const email = parts[2]; const contact = contacts.get(email);
    if (parts[1] === 'contacts') {
      if (!contact) return reply({ statusCode: 404, name: 'not_found', message: 'not found' }, 404);
      if (parts[3] === 'topics') {
        if (req.method === 'GET') return reply({ data: contact.topics, has_more: false });
        contact.topics = body; return reply({ id: contact.id });
      }
      if (parts[3] === 'segments') {
        if (req.method === 'DELETE') contact.segments = contact.segments.filter(s => s.id !== parts[4]);
        if (req.method === 'POST' && !contact.segments.some(s => s.id === parts[4])) contact.segments.push({ id: parts[4] });
        return reply({ id: parts[4] });
      }
      if (req.method === 'PATCH') Object.assign(contact, body);
      return reply(contact);
    }
    reply({ error: 'Unknown simulator path' }, 404);
  } catch (err) { reply({ error: err.message }, 500); }
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const mockOrigin = `http://127.0.0.1:${server.address().port}`;
const origin = 'http://localhost:3017';
const app = spawn(process.execPath, ['node_modules/next/dist/bin/next', 'start', '--port', '3017'], {
  stdio: ['ignore', 'pipe', 'pipe'], env: { ...process.env, NODE_ENV: 'production', VERCEL_ENV: 'development',
    RESEND_API_KEY: 're_local_test_only', RESEND_BASE_URL: mockOrigin, RESEND_FROM_EMAIL: 'letters@example.com',
    SUPABASE_URL: mockOrigin, SUPABASE_SERVICE_ROLE_KEY: 'local-test-only', NEXT_PUBLIC_SITE_URL: origin,
    SEGMENT_NEWSLETTER_ID: 's-site',
    TOPIC_ESSAYS_ID: 't-e', TOPIC_FIELDNOTES_ID: 't-f', TOPIC_PROJECTS_ID: 't-p', TOPIC_WEEKLY_ID: 't-w', TOPIC_MONTHLY_ID: 't-m' },
});
let appOutput = ''; app.stdout.on('data', d => appOutput += d); app.stderr.on('data', d => appOutput += d);
let browser;
try {
  let ready = false;
  for (let i=0; i<100; i++) { try { const r=await fetch(origin); if(r.ok){ready=true;break;} } catch {} await new Promise(r=>setTimeout(r,300)); }
  if (!ready) throw new Error(`App did not start: ${appOutput.slice(-2000)}`);
  browser = await chromium.launch({ ...(process.env.PLAYWRIGHT_BROWSER === 'chromium' ? {} : { channel: 'chrome' }), headless: true });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' });
  const errors = []; page.on('pageerror', e => errors.push(e.message));
  await page.goto(`${origin}/newsletter`);
  const form = page.getByRole('region', { name: 'Newsletter signup', exact: true });
  await form.getByRole('checkbox', { name: /^Essays/ }).check();
  await form.getByRole('checkbox', { name: /^Project updates/ }).check();
  await form.getByLabel('Email address').fill('reader@example.com');
  await form.getByRole('checkbox', { name: /^Email me/ }).check();
  await form.getByRole('button', { name: 'Send confirmation link' }).click();
  await form.getByRole('heading', { name: 'Check your inbox.' }).waitFor();
  assert.equal(contacts.size, 0);
  assert.equal(messages.length, 1);
  const link = messages[0].text.match(/http:\/\/localhost:3017\/newsletter\/confirm#[a-f0-9]+/)[0];
  await page.goto(link);
  await page.getByRole('button', { name: 'Confirm preferences' }).waitFor();
  assert.equal(new URL(page.url()).hash, '');
  assert.equal(await page.getByRole('checkbox', { name: /^Essays/ }).isChecked(), true);
  assert.equal(await page.getByRole('checkbox', { name: /^Field notes/ }).isChecked(), false);
  await page.getByRole('button', { name: 'Confirm preferences' }).click();
  await page.getByRole('heading', { name: 'Your choices are saved.' }).waitFor();
  assert.deepEqual(contacts.get('reader@example.com').segments, [{ id: 's-site' }]);
  await page.goto(link);
  await page.getByRole('alert').filter({hasText:/expired|already used/}).waitFor();
  await page.goto(`${origin}/newsletter#preferences`);
  const manage = page.getByRole('region', { name: 'Manage email preferences' });
  await manage.getByLabel('Email address').fill('reader@example.com');
  await manage.getByRole('button', { name: 'Email my preference link' }).click();
  await manage.getByRole('heading', { name: 'Check your inbox.' }).waitFor();
  const manageLink = messages[1].text.match(/http:\/\/localhost:3017\/newsletter\/confirm#[a-f0-9]+/)[0];
  await page.goto(manageLink);
  await page.getByRole('button', { name: 'Confirm preferences' }).waitFor();
  await page.getByRole('checkbox', { name: /^Essays/ }).uncheck();
  await page.getByRole('checkbox', { name: /^Project updates/ }).uncheck();
  await page.getByRole('checkbox', { name: /^Field notes/ }).check();
  await page.getByRole('checkbox', { name: /^Weekly letters/ }).check();
  await page.getByRole('button', { name: 'Confirm preferences' }).click();
  await page.getByRole('heading', { name: 'Your choices are saved.' }).waitFor();
  assert.deepEqual(contacts.get('reader@example.com').segments, [{ id: 's-site' }]);
  assert.deepEqual(contacts.get('reader@example.com').topics.filter(t => t.subscription === 'opt_in').map(t => t.id), ['t-f', 't-w']);
  await page.goto(`${origin}/newsletter#preferences`);
  const unsubscribe = page.getByRole('region', { name: 'Manage email preferences' });
  await unsubscribe.getByLabel('Email address').fill('reader@example.com');
  await unsubscribe.getByRole('button', { name: 'Email my preference link' }).click();
  await unsubscribe.getByRole('heading', { name: 'Check your inbox.' }).waitFor();
  const unsubscribeLink = messages[2].text.match(/http:\/\/localhost:3017\/newsletter\/confirm#[a-f0-9]+/)[0];
  await page.goto(unsubscribeLink);
  await page.getByRole('button', { name: 'Unsubscribe from everything' }).click();
  await page.getByRole('heading', { name: 'You’re unsubscribed.' }).waitFor();
  assert.ok(contacts.get('reader@example.com').topics.every(t => t.subscription === 'opt_out'));
  assert.equal(contacts.get('reader@example.com').segments.length, 1);
  emailUnavailable = true;
  const failure = await page.request.post(`${origin}/api/newsletter/subscribe`, { data: { email: 'failure@example.com', preferences: ['essay'], consent: true } });
  assert.equal(failure.status(), 502);
  const invalid = await page.request.post(`${origin}/api/newsletter/subscribe`, { data: null });
  assert.equal(invalid.status(), 400);
  assert.deepEqual(errors, []);
  console.log('PASS: browser → Next routes → PostgreSQL → Resend simulator → confirmation → preferences → unsubscribe; replay, provider failure, malformed input, no page errors');
} finally {
  if(browser) await browser.close(); app.kill('SIGTERM');
  await new Promise(resolve => server.close(resolve)); await db.close();
}
