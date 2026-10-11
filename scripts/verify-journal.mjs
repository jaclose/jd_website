/** Real browser acceptance for reading, reflections, export and accessible Sanctum quests. */
import { chromium } from 'playwright-core';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { spawn } from 'node:child_process';
const managed = process.env.JOURNAL_MANAGED_SERVER === '1';
const origin = process.env.JOURNAL_ORIGIN || `http://localhost:${managed ? 3020 : 3018}`;
let app;
if (managed) {
 app = spawn(process.execPath, ['node_modules/next/dist/bin/next','start','--port',new URL(origin).port], {stdio:'ignore'});
 let ready=false;
 for(let i=0;i<100;i++){try{if((await fetch(origin)).ok){ready=true;break;}}catch{} await new Promise(r=>setTimeout(r,300));}
 if(!ready){app.kill('SIGTERM');throw new Error('Journal test server did not start.');}
}
const out = process.env.JOURNAL_OUTPUT || 'artifacts/journal';
await fs.mkdir(out, {recursive:true});
const browser = await chromium.launch({...process.env.PLAYWRIGHT_BROWSER === 'chromium' ? {} : {channel:'chrome'},headless:true});
const report=[];
try {
for (const mode of [{name:'desktop',width:1440,height:900,motion:'no-preference'},{name:'mobile',width:390,height:844,motion:'reduce'}]) {
 const context=await browser.newContext({viewport:{width:mode.width,height:mode.height},reducedMotion:mode.motion});
 const page=await context.newPage(); const faults=[];
 page.on('pageerror',e=>faults.push(e.message));page.on('console',m=>{if(['error','warning'].includes(m.type()))faults.push(m.text())});
 const settle=async()=>{await page.evaluate(()=>{window.__lenis?.stop();document.documentElement.style.scrollBehavior='auto'});await page.waitForTimeout(200)};
 await page.goto(`${origin}/essays#reading-quests`,{waitUntil:'networkidle'}); await settle();
 await page.locator('#reading-quests').scrollIntoViewIfNeeded();
 await page.screenshot({path:`${out}/reading-quests-${mode.name}.png`});
 const quests=page.getByRole('region',{name:'Reading quests'});
 for(const name of ['The work of attention','The way back','A place to begin']) {
  await quests.getByRole('button',{name:new RegExp(name)}).click();
  assert.equal(await quests.getByRole('button',{name:new RegExp(name)}).getAttribute('aria-pressed'),'true');
 }
 assert.equal(await quests.getByRole('link',{name:'Begin chapter →'}).count(),2);
 await quests.getByRole('link',{name:'Begin chapter →'}).first().click();await settle();
 assert.ok(page.url().endsWith('/essays/hello-world'));
 const checkpoint=page.getByRole('region',{name:'Your reading journal'});
 await checkpoint.scrollIntoViewIfNeeded();
 await checkpoint.getByRole('textbox').fill('Attention is a practice, not a mood.');
 await checkpoint.getByRole('button',{name:'Mark as read',exact:true}).click();
 await checkpoint.getByRole('button',{name:'Read · recorded in your journal'}).waitFor();
 await checkpoint.getByRole('button',{name:'Mark unread',exact:true}).click();
 await checkpoint.getByRole('button',{name:'Mark as read',exact:true}).click();
 await page.reload({waitUntil:'networkidle'});await settle();await checkpoint.scrollIntoViewIfNeeded();
 assert.equal(await checkpoint.getByRole('textbox').inputValue(),'Attention is a practice, not a mood.');
 assert.ok(await checkpoint.getByRole('button',{name:'Read · recorded in your journal'}).isDisabled());
 await page.screenshot({path:`${out}/reading-reflection-${mode.name}.png`});
 await page.goto(`${origin}/essays/the-cost-of-knowing-better`,{waitUntil:'networkidle'}); await settle();
 await page.evaluate(()=>{const a=document.querySelector('article.prose-space');window.scrollTo(0,a.getBoundingClientRect().top+window.scrollY+(a.clientHeight-innerHeight)*.4)});
 await page.waitForTimeout(1300);
 await page.reload({waitUntil:'networkidle'});await settle();
 const bookmark=page.getByRole('button',{name:/Resume at/});await bookmark.waitFor();
 await bookmark.click();assert.ok(await page.evaluate(()=>window.scrollY>1000));
 await page.goto(`${origin}/garden?sanctumQuality=low#quest-journal`,{waitUntil:'networkidle'});await settle();
 const journal=page.getByRole('region',{name:'Sanctum quest journal',exact:true});
 await journal.scrollIntoViewIfNeeded();
 await page.evaluate(()=>{const el=document.getElementById('quest-journal');window.scrollTo(0,el.offsetTop-80)});
 await page.screenshot({path:`${out}/sanctum-orb-${mode.name}.png`});
 await journal.getByRole('button',{name:/The Night Garden/}).click();
 await journal.locator('.journal-objectives summary').press('Enter');
 await journal.getByRole('button',{name:'Record this visit',exact:true}).click();
 await page.waitForTimeout(500);
 await page.reload({waitUntil:'networkidle'});await settle();await journal.scrollIntoViewIfNeeded();
 await journal.locator('.journal-objectives').getByText('Completed trail', {exact:true}).waitFor();
 await journal.locator('.journal-objectives summary').press('Enter');
 assert.ok(await journal.getByRole('button',{name:'Visit recorded',exact:true}).isDisabled());
 await page.screenshot({path:`${out}/sanctum-journal-${mode.name}.png`});
 await journal.locator('.journal-achievements summary').click();
 assert.ok((await journal.locator('.journal-achievements li[data-earned=true]').allTextContents()).some(v=>v.includes('Night Gardener')));
 const downloaded=page.waitForEvent('download');await journal.getByRole('button',{name:'Export your journal ↓',exact:true}).click();
 const download=await downloaded;const backup=JSON.parse(await fs.readFile(await download.path(),'utf8'));
 assert.equal(backup.version,1);assert.equal(backup.sanctum.visited.axom,true);assert.ok(backup.reading['hello-world'].completedAt);
 await page.goto(`${origin}/newsletter/preview`,{waitUntil:'networkidle'}); await settle();
 for(const name of ['Essay','Field note','Project','Weekly','Monthly']) {console.log(mode.name+' preview: '+name);await page.getByRole('button',{name,exact:true}).click();await page.frameLocator('iframe').getByRole('heading').first().waitFor();await page.frameLocator('iframe').locator('img').evaluateAll(images=>Promise.all(images.map(img=>Promise.race([img.decode(),new Promise((_,reject)=>setTimeout(()=>reject(new Error('Preview image timeout: '+img.src)),15000))]))));}
 await page.getByRole('button',{name:'Weekly',exact:true}).click();await page.frameLocator('iframe').locator('img').first().waitFor();await page.frameLocator('iframe').locator('img').evaluateAll(images=>Promise.all(images.map(img=>Promise.race([img.decode(),new Promise((_,reject)=>setTimeout(()=>reject(new Error('Preview image timeout')),15000))]))));await page.locator('.email-preview').scrollIntoViewIfNeeded();
 await page.screenshot({path:`${out}/email-preview-${mode.name}.png`});
 await page.goto(`${origin}/newsletter`,{waitUntil:'networkidle'});await settle();
 assert.equal(await page.locator('input[name="preferences"]').count(),5);
 await page.screenshot({path:`${out}/newsletter-next-${mode.name}.png`});
 for(let i=0;i<15;i++){const bottom=await page.evaluate(()=>{window.scrollBy(0,innerHeight*.8);return scrollY+innerHeight>=document.documentElement.scrollHeight-2});await page.waitForTimeout(50);if(bottom)break;}
 const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth);
 assert.equal(overflow,false);
 report.push({mode:mode.name,faults:[...new Set(faults)],overflow});
 await context.close();
}
} finally {await browser.close(); app?.kill('SIGTERM'); await fs.writeFile(`${out}/journal-browser-checks.json`,JSON.stringify(report,null,2));}
assert.ok(report.every(r=>!r.faults.length),JSON.stringify(report));
console.log('PASS: reading trails, all essay coverage, completion/reflection reload, bookmark resume, Sanctum visit/achievement reload, JSON export, all five email previews, desktop/mobile/reduced motion, zero console warnings or errors.');
