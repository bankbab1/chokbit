import type {GenerationRecord} from './recorder';
const url=(import.meta.env.VITE_SUPABASE_URL||'https://lerfurnmnniecmreyzvt.supabase.co').replace(/\/$/,'');
const apiKey=import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY||'sb_publishable_NpVDeqytv6kYyuFVQ28n1Q_Tzs0tLgJ';
export const cloudConfigured=Boolean(url&&apiKey);
const b64=(bytes:Uint8Array)=>btoa(Array.from(bytes,b=>String.fromCharCode(b)).join(''));
const bytes=(s:string)=>Uint8Array.from(atob(s),c=>c.charCodeAt(0));
export type Envelope={version:1;salt:string;iv:string;ciphertext:string;iterations:number};
export async function vaultKey(passphrase:string,salt:Uint8Array){const base=await crypto.subtle.importKey('raw',new TextEncoder().encode(passphrase),'PBKDF2',false,['deriveKey']);return crypto.subtle.deriveKey({name:'PBKDF2',salt:salt as BufferSource,iterations:600000,hash:'SHA-256'},base,{name:'AES-GCM',length:256},false,['encrypt','decrypt']);}
export async function encryptSecret(record:GenerationRecord,key:CryptoKey,salt:Uint8Array):Promise<Envelope>{const iv=crypto.getRandomValues(new Uint8Array(12));const ciphertext=await crypto.subtle.encrypt({name:'AES-GCM',iv,additionalData:new TextEncoder().encode(record.id)},key,new TextEncoder().encode(JSON.stringify({privateKey:record.privateKey,wifCompressed:record.wifCompressed})));return {version:1,salt:b64(salt),iv:b64(iv),ciphertext:b64(new Uint8Array(ciphertext)),iterations:600000};}
export async function decryptSecret(id:string,envelope:Envelope,key:CryptoKey){if(envelope.version!==1||envelope.iterations!==600000)throw new Error('Unsupported encryption format');const plain=await crypto.subtle.decrypt({name:'AES-GCM',iv:bytes(envelope.iv),additionalData:new TextEncoder().encode(id)},key,bytes(envelope.ciphertext));return JSON.parse(new TextDecoder().decode(plain)) as {privateKey:string;wifCompressed:string};}
export type HistoryRow={id:string;owner_id:string;generated_at:string;network:GenerationRecord['network'];status:string;public_key:string;addresses:GenerationRecord['addresses'];encrypted_secret:Envelope;has_balance:boolean;has_transactions:boolean};
export class CloudRecorder{
 private expires=0;private access='';private refresh='';private owner='';private key!:CryptoKey;private salt=crypto.getRandomValues(new Uint8Array(16));private passphrase='';
 private async request<T>(path:string,options:RequestInit={},auth=false):Promise<T>{if(auth&&Date.now()>this.expires-60000)await this.refreshSession();const response=await fetch(`${url}${path}`,{...options,headers:{apikey:apiKey,'Content-Type':'application/json',...(auth?{Authorization:`Bearer ${this.access}`} :{}),...options.headers},signal:AbortSignal.timeout(20000)});if(!response.ok){const body=await response.json().catch(()=>({}));throw new Error(body.msg||body.message||body.error_description||`Supabase HTTP ${response.status}`)}if(response.status===204||options.headers&&new Headers(options.headers).get('Prefer')?.split(',').includes('return=minimal'))return undefined as T;const text=await response.text();if(!text.trim())throw new Error('Supabase returned an empty response where JSON was expected.');return JSON.parse(text) as T;}
 private session(data:{access_token:string;refresh_token:string;expires_in:number;user:{id:string}}){this.access=data.access_token;this.refresh=data.refresh_token;this.expires=Date.now()+data.expires_in*1000;this.owner=data.user.id;}
 private async refreshSession(){this.session(await this.request('/auth/v1/token?grant_type=refresh_token',{method:'POST',body:JSON.stringify({refresh_token:this.refresh})}));}
 static async signIn(email:string,password:string,passphrase:string){if(!cloudConfigured)throw new Error('Configure Supabase environment variables first.');if(!passphrase)throw new Error('Enter your password.');const recorder=new CloudRecorder();recorder.session(await recorder.request('/auth/v1/token?grant_type=password',{method:'POST',body:JSON.stringify({email,password})}));recorder.passphrase=passphrase;recorder.key=await vaultKey(passphrase,recorder.salt);return recorder;}
 async save(record:GenerationRecord){const encrypted=await encryptSecret(record,this.key,this.salt);await this.request('/rest/v1/generation_records?on_conflict=id',{method:'POST',headers:{Prefer:'resolution=merge-duplicates,return=minimal'},body:JSON.stringify({id:record.id,owner_id:this.owner,generated_at:record.generatedAt,network:record.network,status:record.status,public_key:record.publicKey,addresses:record.addresses,encrypted_secret:encrypted,has_balance:record.addresses.some(a=>(a.balanceConfirmedSats??0)>0||(a.balanceTotalSats??0)>0),has_transactions:record.addresses.some(a=>(a.txCount??0)>0)})},true);}
 async signOut(){try{await this.request('/auth/v1/logout',{method:'POST'},true)}finally{this.access='';this.refresh='';this.passphrase='';}}
 async history(options:{page:number;size:number;network:string;activity:string;status:string;address:string}){
 const params=new URLSearchParams({select:'*',owner_id:`eq.${this.owner}`,order:'generated_at.desc,id.desc',offset:String((options.page-1)*options.size),limit:String(options.size+1)});
 if(options.network!=='all')params.set('network',`eq.${options.network}`);
 if(options.activity==='balance')params.set('has_balance','eq.true');
 if(options.activity==='transactions')params.set('has_transactions','eq.true');
 if(options.status!=='all')params.set('status',`eq.${options.status}`);
 if(options.address.trim())params.set('addresses',`cs.${JSON.stringify([{address:options.address.trim()}])}`);
 const rows=await this.request<HistoryRow[]>(`/rest/v1/generation_records?${params}`,{},true);
 return {rows:rows.slice(0,options.size),hasMore:rows.length>options.size};
 }
 async reveal(row:HistoryRow){const key=await vaultKey(this.passphrase,bytes(row.encrypted_secret.salt));try{return await decryptSecret(row.id,row.encrypted_secret,key)}catch{throw new Error('This record uses a different encryption password or an earlier vault passphrase.')}}
}
