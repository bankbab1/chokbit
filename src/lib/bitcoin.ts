import * as btc from '@scure/btc-signer';
import { secp256k1 } from '@noble/curves/secp256k1';
export type Network = 'mainnet' | 'testnet';
export const formats = ['P2PKH','P2WPKH','P2SH','P2TR','P2PKH uncompressed'] as const;
export type Format = typeof formats[number];
export const hex = (b: Uint8Array) => Array.from(b,x=>x.toString(16).padStart(2,'0')).join('');
export function derive(key: Uint8Array, network: Network) {
 const n = network === 'mainnet' ? btc.NETWORK : btc.TEST_NETWORK;
 const pub = secp256k1.getPublicKey(key,true);
 const pubUncompressed=secp256k1.getPublicKey(key,false);
 return { key:hex(key), wif:btc.WIF(n).encode(key), pub:hex(pub), pubUncompressed:hex(pubUncompressed), addresses: [btc.p2pkh(pub,n),btc.p2wpkh(pub,n),btc.p2sh(btc.p2wpkh(pub,n),n),btc.p2tr(pub.slice(1),undefined,n),btc.p2pkh(pubUncompressed,n)].map((x,i)=>({format:formats[i],address:x.address!})) };
}
export function generate(network: Network) {return derive(btc.utils.randomPrivateKeyBytes(),network);}
export const api = (n:Network) => n==='mainnet' ? 'https://blockstream.info/api' : 'https://blockstream.info/testnet/api';
export const explorer = (n:Network) => n==='mainnet' ? 'https://blockstream.info' : 'https://blockstream.info/testnet';
export type Stats={funded_txo_sum:number;spent_txo_sum:number;tx_count:number};
export type Activity={chain_stats:Stats;mempool_stats:Stats};
export type Tx={txid:string;fee:number;status:{confirmed:boolean;block_time?:number;block_height?:number}};
export async function getJSON<T>(url:string,signal:AbortSignal):Promise<T>{
 const response=await fetch(url,{signal:AbortSignal.any([signal,AbortSignal.timeout(15000)])});
 if(!response.ok) throw new Error(response.status===429?'Rate limit reached. Wait before checking again.':`Explorer returned HTTP ${response.status}.`);
 return response.json();
}
export const sats=(s:Stats)=>s.funded_txo_sum-s.spent_txo_sum;
