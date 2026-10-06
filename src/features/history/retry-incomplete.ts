import type {CloudRecorder,HistoryRow} from '../../lib/cloud';
import {API_PROVIDERS,type ApiProvider} from '../../lib/bitcoin';
// Snapshot before updating: offset pagination would skip rows as complete records leave the filter.
export async function retryIncomplete(client:Pick<CloudRecorder,'history'|'recheck'>,filters:{network:string;activity:string;address:string},provider:ApiProvider,signal:AbortSignal,onStatus:(message:string)=>void){
 const rows:HistoryRow[]=[];const seen=new Set<string>();
 for(let page=1;;page++){
  signal.throwIfAborted();const result=await client.history({...filters,status:'incomplete',page,size:50});signal.throwIfAborted();
  for(const row of result.rows)if(!seen.has(row.id)){seen.add(row.id);rows.push(row)}
  if(!result.hasMore)break;
 }
 if(!rows.length){onStatus('No incomplete records match these filters.');return}
 let done=0;
 for(const row of rows){
  signal.throwIfAborted();onStatus(`Record ${done+1}/${rows.length} · ${API_PROVIDERS[provider]}`);
  const updated=await client.recheck(row,signal,(checked,total)=>onStatus(`Record ${done+1}/${rows.length} · addresses ${checked}/${total} · ${API_PROVIDERS[provider]}`),provider);
  done++;
  if(updated.status!=='complete'){onStatus(`Paused after ${done}/${rows.length} records: some checks failed. Choose a provider and retry the remaining incomplete records.`);return}
 }
 onStatus(`Finished: ${done}/${rows.length} records rechecked and saved.`);
}
