import test from 'node:test';
import { PGlite } from '@electric-sql/pglite';
import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
test('database enforces limits, one-time confirmation and private access', async () => {
const db = new PGlite();
try {
await db.exec('create role anon; create role authenticated; create role service_role bypassrls;');
await db.exec(readFileSync(new URL('../supabase/migrations/20261011125729_newsletter_confirmations.sql', import.meta.url),'utf8'));
await db.exec(readFileSync(new URL('../supabase/migrations/20261011170000_newsletter_digest_preferences.sql', import.meta.url),'utf8'));
await db.exec('set role service_role');
const issue = async (n: number, email='reader@example.com', ip='hashed-ip') => (await db.query<{ok: boolean}>('select newsletter_issue($1,$2,$3,$4,$5) as ok',[n.toString(16).padStart(64,'0'),email,['essay'],'subscribe',ip])).rows[0].ok;
assert.equal(await issue(1),true); assert.equal(await issue(2),true); assert.equal(await issue(3),true); assert.equal(await issue(4),false);
const consume = async (n: number) => (await db.query('select * from newsletter_consume($1)',[n.toString(16).padStart(64,'0')])).rows;
assert.equal((await consume(1)).length,1); assert.equal((await consume(1)).length,0); assert.equal((await consume(2)).length,0);
await issue(5,'expired@example.com');
await db.query("update newsletter_requests set expires_at=now()-interval '1 minute' where email=$1",['expired@example.com']);
assert.equal((await consume(5)).length,0);
for(let i=6;i<=11;i++) assert.equal(await issue(i,`reader${i}@example.com`),true);
assert.equal(await issue(12,'limit@example.com'),false);
await db.exec('reset role; set role anon');
await assert.rejects(db.query('select * from newsletter_requests'));
await assert.rejects(db.query('select newsletter_consume($1)',['a'.repeat(64)]));
await db.exec('reset role; set role authenticated');
await assert.rejects(db.query('select * from newsletter_requests'));
} finally { await db.close(); }
});
