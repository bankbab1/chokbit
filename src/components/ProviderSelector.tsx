import {Select} from './Field';
import {API_PROVIDERS,type ApiProvider} from '../lib/bitcoin';
export function ProviderSelector({value,onChange,disabled=false}:{value:ApiProvider;onChange:(provider:ApiProvider)=>void;disabled?:boolean}){
 return <label>API provider<Select value={value} disabled={disabled} onChange={event=>onChange(event.target.value as ApiProvider)}>{Object.entries(API_PROVIDERS).map(([id,name])=><option key={id} value={id}>{name}</option>)}</Select></label>;
}
