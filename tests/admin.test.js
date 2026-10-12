import test from 'node:test';import assert from 'node:assert/strict';import {spawn} from 'node:child_process';import {once} from 'node:events';import {mkdtemp,rm,readFile} from 'node:fs/promises';import os from 'node:os';import path from 'node:path';import {scryptSync} from 'node:crypto';
test('admin authentication, CSRF protection, settings persistence and analytics deduplication',async()=>{
 const dir=await mkdtemp(path.join(os.tmpdir(),'ulab-test-'));const salt='test-salt',password='test-password-only';const env={...process.env,PORT:'3097',DATABASE_URL:'',DATA_DIR:dir,SESSION_SECRET:'a'.repeat(64),ADMIN_PASSWORD_HASH:salt+':'+scryptSync(password,salt,64).toString('hex'),GEMINI_API_KEY:'',AI_CONFIG_ENCRYPTION_KEY:'b'.repeat(64),NODE_ENV:'test'};
 let child;async function start(){child=spawn(process.execPath,['server/index.js'],{env,stdio:['ignore','pipe','pipe']});await once(child.stdout,'data');}async function stop(){child.kill();await once(child,'exit');}
 let admin='',visitor='';async function call(route,body,cookie='',origin){const res=await fetch('http://127.0.0.1:3097'+route,{method:body?'POST':'GET',headers:{...(body?{'Content-Type':'application/json'}:{}),...(cookie?{Cookie:cookie}:{}),...(origin?{Origin:origin}:{})},...(body?{body:JSON.stringify(body)}:{})});return {status:res.status,data:await res.json(),cookie:res.headers.get('set-cookie')?.split(';')[0]};}
 try{await start();assert.equal((await call('/api/admin/stats')).status,401);assert.equal((await call('/api/admin/login',{password:'wrong'})).status,401);const login=await call('/api/admin/login',{password});assert.equal(login.status,200);admin=login.cookie;assert.ok(admin.startsWith('ulab_admin='));assert.equal((await call('/api/admin/session',null,admin)).status,200);
 const config=(await call('/api/site')).data;config.siteTitle='My Student Workspace';config.tagline='First line\nSecond line';config.aboutText='Custom about text';
 assert.equal((await call('/api/admin/settings',config,'')).status,401);
 assert.equal((await call('/api/admin/settings',config,admin,'https://attacker.example')).status,403);
 assert.equal((await call('/api/admin/settings',{...config,siteLogo:'data:image/svg+xml,bad'},admin)).status,400);
 const png=await readFile('public/ulab-logo.png');config.coverLogo='data:image/png;base64,'+png.toString('base64');assert.equal((await call('/api/admin/settings',config,admin)).status,200);assert.equal((await call('/api/site')).data.siteTitle,config.siteTitle);
 const visit=await call('/api/events',{kind:'visit',id:'visit-12345678901234567890'});visitor=visit.cookie;assert.ok(visitor);await call('/api/events',{kind:'visit',id:'visit-12345678901234567890'},visitor);await call('/api/events',{kind:'merge',quantity:3,id:'merge-12345678901234567890'},visitor);await call('/api/events',{kind:'routine',id:'routine-12345678901234567890'},visitor);assert.equal((await call('/api/events',{kind:'cover',id:'cover-12345678901234567890'},visitor)).status,400);
 const stats=(await call('/api/admin/stats',null,admin)).data;assert.equal(stats.counts.visit,1);assert.equal(stats.counts.merge,1);assert.equal(stats.pdfsMerged,3);assert.equal(stats.counts.routine,1);assert.equal(stats.uniqueVisitors,1);assert.equal(stats.aiUsers,0);
 assert.equal((await call('/api/routine',{image:'AA==',mimeType:'image/png'},visitor)).status,503);
 const failures=(await call('/api/admin/ai-failures',null,admin)).data;assert.equal(failures.items[0].code,'missing_key');
 assert.equal((await call('/api/admin/ai',{model:'gemini-2.5-flash',apiKey:'fake-key-for-test-only'})).status,401);
 const aiSaved=await call('/api/admin/ai',{model:'gemini-2.5-flash',apiKey:'fake-key-for-test-only'},admin);assert.equal(aiSaved.status,200);assert.equal(aiSaved.data.configured,true);assert.ok(!JSON.stringify(aiSaved.data).includes('fake-key'));
 assert.ok(!JSON.stringify((await call('/api/site')).data).includes('fake-key'));assert.equal((await call('/api/site')).data.aboutText,'Custom about text');
 await stop();await start();assert.equal((await call('/api/admin/ai',null,admin)).data.source,'dashboard');await call('/api/admin/ai',{model:'gemini-2.5-flash',clearKey:true},admin);
assert.equal((await call('/api/site')).data.siteTitle,config.siteTitle);assert.equal((await call('/api/admin/stats',null,admin)).data.counts.merge,1);
 await call('/api/admin/logout',{},admin);assert.equal((await call('/api/admin/session',null,admin)).status,401);
 }finally{if(child&&child.exitCode===null)await stop();await rm(dir,{recursive:true,force:true});}
});
