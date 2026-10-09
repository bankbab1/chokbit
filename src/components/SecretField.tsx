import {useEffect,useRef,useState} from 'react';
import {Copy,Check,Eye,EyeOff} from 'lucide-react';

/** Only an explicit eye action reveals secrets; copying does not reveal them. */
export function SecretField({label,value='',readValue,onChange,disabled=false,placeholder='64 hexadecimal characters'}:{label:string;value?:string;readValue?:()=>Promise<string>;onChange?:(value:string)=>void;disabled?:boolean;placeholder?:string}){
 const [revealed,setRevealed]=useState(false),[loaded,setLoaded]=useState<string|null>(null),[busy,setBusy]=useState(false),[copied,setCopied]=useState(false),[error,setError]=useState('');
 const mounted=useRef(true),timer=useRef<ReturnType<typeof setTimeout>|null>(null);
 useEffect(()=>{mounted.current=true;return()=>{mounted.current=false;if(timer.current)clearTimeout(timer.current)}},[]);
 const editable=Boolean(onChange);
 useEffect(()=>{if(!editable||!value)setRevealed(false);setLoaded(null);setCopied(false);setError('')},[value,editable]);
 async function secret(){if(loaded!==null)return loaded;return readValue?await readValue():value}
 async function reveal(){if(revealed){setRevealed(false);return}setBusy(true);setError('');try{const text=await secret();if(mounted.current){setLoaded(text);setRevealed(true)}}catch(e){if(mounted.current)setError(e instanceof Error?e.message:'Unable to reveal')}finally{if(mounted.current)setBusy(false)}}
 async function copy(){setBusy(true);setError('');try{const text=await secret();await navigator.clipboard.writeText(text);if(mounted.current){setCopied(true);if(timer.current)clearTimeout(timer.current);timer.current=setTimeout(()=>setCopied(false),1600)}}catch(e){if(mounted.current)setError(e instanceof Error?e.message:'Clipboard unavailable')}finally{if(mounted.current)setBusy(false)}}
 return <div className="secret-field"><span className="secret-label">{label}</span><div className="secret-control">{onChange?<input aria-label={label} type={revealed?'text':'password'} value={value} disabled={disabled} onChange={e=>{setLoaded(null);onChange(e.target.value)}} autoComplete="off" autoCapitalize="off" spellCheck={false} placeholder={placeholder}/>:<code>{revealed?(loaded??value):'••••••••••••••••••••••••••••••••'}</code>}<button type="button" className="icon-button" aria-label={`${revealed?'Hide':'Show'} ${label}`} aria-pressed={revealed} disabled={busy||disabled||(!value&&!readValue)} onClick={()=>void reveal()}>{revealed?<EyeOff size={17}/>:<Eye size={17}/>}</button><button type="button" className="icon-button" aria-label={`Copy ${label}`} disabled={busy||disabled||(!value&&!readValue)} onClick={()=>void copy()}>{copied?<Check size={17}/>:<Copy size={17}/>}</button></div>{(error||busy||copied)&&<small className={error?'error':''} role="status">{error||(busy?'Working…':'Copied to clipboard')}</small>}</div>;
}
