// Worker API: verify Firebase ID tokens and enforce an explicit officer UID allowlist.
const json = (data, status = 200) => new Response(JSON.stringify(data), {status, headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store','x-content-type-options':'nosniff'}});
const decode = s => Uint8Array.from(atob(s.replace(/-/g,'+').replace(/_/g,'/').padEnd(Math.ceil(s.length/4)*4,'=')), c => c.charCodeAt(0));
const parse = s => JSON.parse(new TextDecoder().decode(decode(s)));
let keyCache = {expiry:0, keys:[]};
async function authorized(req, env) {
 try {
  if (!env.FIREBASE_PROJECT_ID || !env.ADMIN_UIDS) return false;
  const match = /^Bearer ([A-Za-z0-9._-]+)$/.exec(req.headers.get('authorization') || '');
  if (!match) return false;
  const parts=match[1].split('.'); if(parts.length!==3) return false;
  const h=parse(parts[0]), p=parse(parts[1]), now=Math.floor(Date.now()/1000);
  const officers=env.ADMIN_UIDS.split(',').map(x=>x.trim()).filter(Boolean);
  if(h.alg!=='RS256' || typeof h.kid!=='string' || p.aud!==env.FIREBASE_PROJECT_ID || p.iss!==`https://securetoken.google.com/${env.FIREBASE_PROJECT_ID}` || typeof p.sub!=='string' || !officers.includes(p.sub) || !Number.isFinite(p.exp) || p.exp<=now || !Number.isFinite(p.iat) || p.iat>now || !Number.isFinite(p.auth_time) || p.auth_time>now) return false;
  if(keyCache.expiry<Date.now() || !keyCache.keys.some(k=>k.kid===h.kid)) {
    const response=await fetch('https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com');
    if(!response.ok) return false;
    const keys=await response.json(); keyCache={expiry:Date.now()+300000,keys:keys.keys || []};
  }
  const jwk=keyCache.keys.find(k=>k.kid===h.kid && k.kty==='RSA'); if(!jwk) return false;
  const key=await crypto.subtle.importKey('jwk',jwk,{name:'RSASSA-PKCS1-v1_5',hash:'SHA-256'},false,['verify']);
  return await crypto.subtle.verify('RSASSA-PKCS1-v1_5',key,decode(parts[2]),new TextEncoder().encode(parts[0]+'.'+parts[1]));
 } catch { return false; }
}
function text(v,max,required=false) { if(typeof v!=='string') throw Error('Invalid field'); v=v.trim(); if(v.length>max || (required && !v)) throw Error('Invalid field'); return v; }
async function body(req) {
 if (!req.headers.get('content-type')?.startsWith('application/json')) throw Error('JSON required');
 const raw=await req.text(); if(raw.length>12000) throw Error('Request too large'); return JSON.parse(raw);
}
function safeURL(v) { v=text(v||'',1000); if(!v) return ''; const u=new URL(v); if(u.protocol!=='https:') throw Error('Only HTTPS links are allowed'); return u.href; }
async function antiSpam(req, env, token) {
 if(!env.TURNSTILE_SECRET_KEY || !token) return false;
 const data = new URLSearchParams({secret:env.TURNSTILE_SECRET_KEY,response:token});
 const ip=req.headers.get('CF-Connecting-IP'); if(ip) data.set('remoteip',ip);
 const res=await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify',{method:'POST',body:data});
 if(!res.ok) return false;
 const result=await res.json(); return result.success === true && result.hostname === new URL(req.url).hostname;
}
export default {async fetch(req,env) {
 const url=new URL(req.url), path=url.pathname, method=req.method;
 if(!path.startsWith('/api/')) return env.ASSETS.fetch(req);
 try {
  if(path==='/api/config' && method==='GET') return json({turnstileSiteKey:env.TURNSTILE_SECRET_KEY ? (env.TURNSTILE_SITE_KEY || '') : ''});
  if(path==='/api/content' && method==='GET') {
   const {results}=await env.DB.prepare('SELECT id,kind,title,detail,url FROM content WHERE published=1 ORDER BY updated_at DESC LIMIT 100').all(); return json({items:results});
  }
  if(path==='/api/inquiries' && method==='POST') {
   if(req.headers.get('origin')!==url.origin) return json({error:'Invalid origin'},403);
   const d=await body(req);
   if (!await antiSpam(req,env,text(d.turnstileToken,4096,true))) return json({error:'Verification failed. Please try again.'},403);
   const category=text(d.category,20,true); if(!['member','project'].includes(category)) throw Error('Invalid category');
   await env.DB.prepare('INSERT INTO inquiries (id,created_at,category,name,contact,pathway,avenue,message) VALUES (?,?,?,?,?,?,?,?)').bind(crypto.randomUUID(),new Date().toISOString(),category,text(d.name,100,true),text(d.contact,200,true),text(d.pathway,200,true),text(d.avenue,200,true),text(d.message||'',4000)).run();
   return json({ok:true},201);
  }
  if(path.startsWith('/api/admin/')) {
   if(!await authorized(req,env)) return json({error:'Unauthorized'},401);
   if(!['GET','HEAD'].includes(method) && req.headers.get('origin')!==url.origin) return json({error:'Invalid origin'},403);
   if(path==='/api/admin/inquiries' && method==='GET') { const {results}=await env.DB.prepare('SELECT * FROM inquiries ORDER BY created_at DESC LIMIT 200').all(); return json({items:results}); }
   const inquiry=path.match(/^\/api\/admin\/inquiries\/([a-f0-9-]{36})$/);
   if(inquiry && method==='DELETE') { await env.DB.prepare('DELETE FROM inquiries WHERE id=?').bind(inquiry[1]).run(); return json({ok:true}); }
   if(inquiry && method==='PATCH') { const d=await body(req); if(!['new','reviewed'].includes(d.status)) throw Error('Invalid status'); await env.DB.prepare('UPDATE inquiries SET status=? WHERE id=?').bind(d.status,inquiry[1]).run(); return json({ok:true}); }
   if(path==='/api/admin/content' && method==='GET') { const {results}=await env.DB.prepare('SELECT * FROM content ORDER BY updated_at DESC LIMIT 200').all(); return json({items:results}); }
   if(path==='/api/admin/content' && method==='POST') {
    const d=await body(req); if(!['leader','project','link'].includes(d.kind)) throw Error('Invalid kind');
    const id=crypto.randomUUID(), now=new Date().toISOString();
    await env.DB.prepare('INSERT INTO content (id,kind,title,detail,url,published,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?)').bind(id,d.kind,text(d.title,160,true),text(d.detail,2000,true),safeURL(d.url),d.published===true?1:0,now,now).run(); return json({id},201);
   }
   const item=path.match(/^\/api\/admin\/content\/([a-f0-9-]{36})$/);
   if(item && method==='DELETE') { await env.DB.prepare('DELETE FROM content WHERE id=?').bind(item[1]).run(); return json({ok:true}); }
   if(item && method==='PUT') { const d=await body(req); if(!['leader','project','link'].includes(d.kind)) throw Error('Invalid kind'); await env.DB.prepare('UPDATE content SET kind=?,title=?,detail=?,url=?,published=?,updated_at=? WHERE id=?').bind(d.kind,text(d.title,160,true),text(d.detail,2000,true),safeURL(d.url),d.published===true?1:0,new Date().toISOString(),item[1]).run(); return json({ok:true}); }
  }
  return json({error:'Not found'},404);
 } catch(e) { console.error('API failure',e.message); return json({error:'Request could not be completed.'},400); }
}};
