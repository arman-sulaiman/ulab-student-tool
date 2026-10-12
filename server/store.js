import fs from 'node:fs/promises';
import path from 'node:path';
let ready,query;
export const defaults={siteTitle:'ULAB Student Tool',badge:'MADE FOR STUDENT LIFE',tagline:'Less formatting.\nMore time for learning.',disclaimer:'Independent student utility',footer:'Built for the work between classes.',siteLogo:'',coverLogo:'',aboutText:'An independent student utility based on ULAB cover-page samples. Not an official university service.'};
async function init(){
 if(process.env.DATABASE_URL){const {Pool}=await import('pg');const pool=new Pool({connectionString:process.env.DATABASE_URL,max:3,idleTimeoutMillis:10000,connectionTimeoutMillis:10000});query=async(sql,args=[]) => (await pool.query(sql,args)).rows;}
 else{if(process.env.VERCEL)throw new Error('DATABASE_URL is required on Vercel.');const dir=process.env.DATA_DIR||'data';await fs.mkdir(dir,{recursive:true});const {DatabaseSync}=await import('node:sqlite');const db=new DatabaseSync(path.join(dir,'ulab.sqlite'));db.exec('PRAGMA journal_mode=WAL; PRAGMA busy_timeout=5000');query=async(sql,args=[])=>db.prepare(sql.replace(/\$\d+/g,'?')).all(...args);}
 for(const sql of [
 'CREATE TABLE IF NOT EXISTS ai_failures (id TEXT PRIMARY KEY, created BIGINT NOT NULL, code TEXT NOT NULL, model TEXT NOT NULL)',
 'CREATE TABLE IF NOT EXISTS settings (id TEXT PRIMARY KEY, value TEXT NOT NULL)',
 'CREATE TABLE IF NOT EXISTS events (id TEXT PRIMARY KEY, visitor TEXT NOT NULL, kind TEXT NOT NULL, day TEXT NOT NULL, created BIGINT NOT NULL, quantity INTEGER NOT NULL DEFAULT 1)',
 'CREATE INDEX IF NOT EXISTS events_day ON events(day)',
 'CREATE TABLE IF NOT EXISTS sessions (id TEXT PRIMARY KEY, expires BIGINT NOT NULL)',
 'CREATE TABLE IF NOT EXISTS limits (id TEXT PRIMARY KEY, count INTEGER NOT NULL, expires BIGINT NOT NULL)'])await query(sql);
}
export async function db(sql,args=[]){if(!ready)ready=init().catch(e=>{ready=null;throw e;});await ready;return query(sql,args);}
export async function settings(){const rows=await db('SELECT value FROM settings WHERE id=$1',['public']);return {...defaults,...(rows[0]?JSON.parse(rows[0].value):{})};}
export async function saveSettings(value){await db('INSERT INTO settings(id,value) VALUES ($1,$2) ON CONFLICT(id) DO UPDATE SET value=excluded.value',['public',JSON.stringify(value)]);return value;}
export async function event(id,visitor,kind,quantity=1){await db('INSERT INTO events(id,visitor,kind,day,created,quantity) VALUES ($1,$2,$3,$4,$5,$6) ON CONFLICT(id) DO NOTHING',[id,visitor,kind,new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Dhaka'}).format(new Date()),Date.now(),quantity]);}
export async function limited(key,max,window=60000){const now=Date.now(),id=key+':'+Math.floor(now/window);const rows=await db('INSERT INTO limits(id,count,expires) VALUES ($1,1,$2) ON CONFLICT(id) DO UPDATE SET count=limits.count+1 RETURNING count',[id,now+window]);await db('DELETE FROM limits WHERE expires < $1',[now]);return Number(rows[0].count)>max;}
export async function stats(from,to){const rows=await db('SELECT kind,COUNT(*) AS total,SUM(quantity) AS units,COUNT(DISTINCT visitor) AS people FROM events WHERE day >= $1 AND day <= $2 GROUP BY kind',[from,to]);const unique=await db('SELECT COUNT(DISTINCT visitor) AS total FROM events WHERE day >= $1 AND day <= $2',[from,to]);const daily=await db('SELECT day,kind,COUNT(*) AS total FROM events WHERE day >= $1 AND day <= $2 GROUP BY day,kind ORDER BY day DESC',[from,to]);return {pdfsMerged:Number(rows.find(r=>r.kind==='merge')?.units||0),uniqueVisitors:Number(unique[0].total),counts:Object.fromEntries(rows.map(r=>[r.kind,Number(r.total)])),aiUsers:Number(rows.find(r=>r.kind==='ai')?.people||0),daily:daily.map(r=>({...r,total:Number(r.total)}))};}
