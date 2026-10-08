import * as btc from '@scure/btc-signer';
import {secp256k1} from '@noble/curves/secp256k1';
import {api,hex,type Network,type ApiProvider} from '../../lib/bitcoin';
export type Utxo={txid:string;vout:number;value:number;status:{confirmed:boolean}};
export function amountSats(value:string):bigint{if(!/^(0|[1-9]\d*)(\.\d{1,8})?$/.test(value.trim()))throw new Error('Enter BTC with at most 8 decimal places.');const [whole,fraction='']=value.trim().split('.');const amount=BigInt(whole)*100000000n+BigInt(fraction.padEnd(8,'0'));if(amount<546n||amount>2100000000000000n)throw new Error('Amount must be at least 546 sats and within Bitcoin supply.');return amount;}
const decodeHex=(value:string)=>{if(!/^(?:[a-f0-9]{2})+$/i.test(value))throw new Error('Invalid transaction data from provider.');return Uint8Array.from(value.match(/../g)!,b=>parseInt(b,16));};
export function payment(key:Uint8Array,index:number,network:Network){const n=network==='mainnet'?btc.NETWORK:btc.TEST_NETWORK;const pub=secp256k1.getPublicKey(key,true);const choices=[btc.p2pkh(pub,n),btc.p2wpkh(pub,n),btc.p2sh(btc.p2wpkh(pub,n),n),btc.p2tr(pub.slice(1),undefined,n),btc.p2pkh(secp256k1.getPublicKey(key,false),n)];if(!choices[index])throw new Error('Select a source address.');return choices[index];}
export async function prepareTransfer(key:Uint8Array,index:number,network:Network,provider:ApiProvider,destination:string,amount:bigint,rate:number,signal:AbortSignal){
 if(index===4)throw new Error('Uncompressed Legacy spending is not supported by this signer.');
 if(!Number.isFinite(rate)||rate<1||rate>1000)throw new Error('Fee rate must be 1–1000 sats/vB.');
 const n=network==='mainnet'?btc.NETWORK:btc.TEST_NETWORK;const target=destination.trim();const destinationScript=btc.OutScript.encode(btc.Address(n).decode(target));const source=payment(key,index,network);
 if(target===source.address)throw new Error('Destination must differ from the source address.');
 const response=await fetch(`${api(network,provider)}/address/${source.address}/utxo`,{signal});if(!response.ok)throw new Error(`UTXO lookup failed: HTTP ${response.status}`);const outputs=await response.json() as Utxo[];
 const utxos=outputs.filter(u=>u.status.confirmed);if(!utxos.length)throw new Error('No confirmed spendable outputs at this address.');if(utxos.length>100)throw new Error('This address has over 100 outputs. Use a dedicated wallet for coin selection.');
 const tx=new btc.Transaction();let total=0n;const seen=new Set<string>();
 for(const u of utxos){signal.throwIfAborted();if(!Number.isSafeInteger(u.value)||u.value<=0||!Number.isInteger(u.vout)||u.vout<0||! /^[a-f0-9]{64}$/i.test(u.txid)||seen.has(`${u.txid}:${u.vout}`))throw new Error('Invalid UTXO data.');seen.add(`${u.txid}:${u.vout}`);
 const previousResponse=await fetch(`${api(network,provider)}/tx/${u.txid}/hex`,{signal});if(!previousResponse.ok)throw new Error('Unable to verify previous transaction.');const raw=decodeHex((await previousResponse.text()).trim());const previous=btc.Transaction.fromRaw(raw);const output=previous.getOutput(u.vout);if(previous.id!==u.txid||output.amount!==BigInt(u.value)||!output.script||hex(output.script)!==hex(source.script))throw new Error('Previous transaction does not match the selected address and amount.');
 total+=BigInt(u.value);tx.addInput({txid:u.txid,index:u.vout,nonWitnessUtxo:raw,...(index===0||index===4?{}:{witnessUtxo:{script:source.script,amount:BigInt(u.value)}}),...(index===2?{redeemScript:btc.p2wpkh(secp256k1.getPublicKey(key,true),n).script}:{}),...(index===3?{tapInternalKey:secp256k1.getPublicKey(key,true).slice(1)}:{})});
 }
 const estimate=12+utxos.length*[149,69,92,58,181][index]+9+destinationScript.length+9+source.script.length;
 let fee=BigInt(Math.ceil(estimate*rate));let change=total-amount-fee;if(change<0n)throw new Error('Insufficient confirmed funds for amount and fee.');if(change<546n){fee+=change;change=0n;}
 tx.addOutputAddress(target,amount,n);if(change)tx.addOutputAddress(source.address!,change,n);
 tx.sign(key);
 tx.finalize();if(Number(fee)/tx.vsize<rate)throw new Error('Fee estimation failed. No transaction was broadcast.');
 return {raw:tx.hex,txid:tx.id,source:source.address!,destination:target,amount,fee,change,vsize:tx.vsize,inputs:utxos.length,network,provider};
}
export type TransferDraft=Awaited<ReturnType<typeof prepareTransfer>>;
