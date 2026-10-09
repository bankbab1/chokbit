import {useEffect,useRef,useState} from 'react';
import {Select} from './Field';
import {type CloudRecorder,type RangePreset} from '../lib/cloud';
import {parsePrivateKey} from '../lib/private-key';

export function RangePresets({client,start,end,onStart,onEnd,disabled}:{client:CloudRecorder|null;start:string;end:string;onStart:(value:string)=>void;onEnd:(value:string)=>void;disabled:boolean}){
 const [rows,setRows]=useState<RangePreset[]>([]),[selected,setSelected]=useState(''),[name,setName]=useState(''),[busy,setBusy]=useState(false),[message,setMessage]=useState('');
 const latest=useRef({start,end,onStart,onEnd});latest.current={start,end,onStart,onEnd};
 const generation=useRef(0);
 const apply=(row:RangePreset)=>{latest.current.onStart(row.start_key);latest.current.onEnd(row.end_key);setSelected(row.id);setName(row.name)};
 useEffect(()=>{
  const token=++generation.current;const initial={start:latest.current.start,end:latest.current.end};
  setRows([]);setSelected('');setName('');setMessage('');
  if(!client)return;
  setBusy(true);
  void client.rangePresets().then(data=>{if(token!==generation.current)return;setRows(data);if(data[0]&&latest.current.start===initial.start&&latest.current.end===initial.end)apply(data[0])}).catch(e=>{if(token===generation.current)setMessage(e instanceof Error?e.message:'Could not load ranges')}).finally(()=>{if(token===generation.current)setBusy(false)});
  return ()=>{generation.current++};
 },[client]);
 const mutate=async(action:(token:number)=>Promise<void>)=>{const token=generation.current;setBusy(true);setMessage('');try{await action(token)}catch(e){if(token===generation.current)setMessage(e instanceof Error?e.message:'Range operation failed')}finally{if(token===generation.current)setBusy(false)}};
 const locked=disabled||busy||!client;
 return <div className="range-presets"><label>Saved ranges<Select value={selected} disabled={locked} onChange={e=>{const row=rows.find(r=>r.id===e.target.value);if(row&&client)void mutate(async(token)=>{await client.useRange(row.id);if(token===generation.current)apply(row)})}}><option value="">Choose saved range</option>{rows.map(row=><option key={row.id} value={row.id}>{row.name}</option>)}</Select></label><label>Range name<input value={name} maxLength={80} disabled={locked} onChange={e=>setName(e.target.value)} placeholder="My range"/></label><div className="range-actions"><button type="button" className="secondary" disabled={locked||!start.trim()||!end.trim()||!name.trim()} onClick={()=>void mutate(async(token)=>{
  if(!client)return;const first=start.trim().toLowerCase(),last=end.trim().toLowerCase();parsePrivateKey(first);parsePrivateKey(last);if(BigInt('0x'+first)>BigInt('0x'+last))throw new Error('Range start must be at or below range end.');
  const data=await client.saveRange(name.trim(),first,last);if(token!==generation.current)return;const row=data[0];if(!row)throw new Error('Range was not saved.');setRows(old=>[row,...old.filter(r=>r.id!==row.id)]);apply(row);setMessage('Range saved. It will load by default in both screens.');
 })}>Save range</button><button type="button" className="secondary" disabled={disabled||busy} onClick={()=>{onStart('');onEnd('');setSelected('');setName('');setMessage('Fields cleared. Saved presets are kept.')}}>× Clear fields</button><button type="button" className="stop" disabled={locked||!selected} onClick={()=>void mutate(async(token)=>{if(!client)return;await client.deleteRange(selected);if(token!==generation.current)return;setRows(old=>old.filter(r=>r.id!==selected));setSelected('');setName('');onStart('');onEnd('');setMessage('Saved range deleted.')})}>× Delete saved</button></div>{busy&&<p role="status">Loading saved ranges…</p>}{message&&<p role="status">{message}</p>}{!client&&<p>Sign in to load and save ranges.</p>}</div>;
}
