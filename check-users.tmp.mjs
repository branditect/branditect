import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
const env = Object.fromEntries(fs.readFileSync('.env.local','utf8').split('\n')
  .filter(l=>l.includes('=') && !l.trim().startsWith('#'))
  .map(l=>{const i=l.indexOf('='); return [l.slice(0,i).trim(), l.slice(i+1).trim().replace(/^["']|["']$/g,'')];}));
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

const { data: list, error: uErr } = await sb.auth.admin.listUsers({ page:1, perPage:20 });
if (uErr) { console.log('AUTH ERROR:', uErr.message); process.exit(1); }
const users = list.users.sort((a,b)=> new Date(b.created_at)-new Date(a.created_at)).slice(0,6);

const { data: brands } = await sb.from('brands').select('brand_id,user_id,brand_name,onboarding_completed,created_at');
const byUser = {}; (brands||[]).forEach(b=>{ (byUser[b.user_id] ||= []).push(b); });

console.log('viimeisimmat kayttajat:\n');
for (const u of users) {
  const bs = byUser[u.id] || [];
  console.log('email      :', u.email);
  console.log('luotu      :', u.created_at?.slice(0,19));
  console.log('vahvistettu:', u.email_confirmed_at ? 'KYLLA' : 'EI');
  console.log('brandirivi :', bs.length ? bs.map(b=>b.brand_id).join(', ') : '*** EI YHTAAN ***');
  console.log('---');
}
console.log('brands-rivejä yhteensä:', (brands||[]).length);
