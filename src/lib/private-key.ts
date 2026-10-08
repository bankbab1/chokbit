import {secp256k1} from '@noble/curves/secp256k1';
export const MAX_PRIVATE_KEY=secp256k1.CURVE.n-1n;
export function parsePrivateKey(input:string):Uint8Array {
 const value=input.trim();
 if(!/^[0-9a-fA-F]{64}$/.test(value))throw new Error('Enter exactly 64 hexadecimal characters (0–9, A–F).');
 const scalar=BigInt(`0x${value}`);
 if(scalar<1n||scalar>MAX_PRIVATE_KEY)throw new Error('Private key is outside the valid secp256k1 range.');
 return Uint8Array.from(value.match(/../g)!,pair=>parseInt(pair,16));
}
export function adjacentPrivateKey(input:string,direction:1|-1):string {
 parsePrivateKey(input);const value=BigInt(`0x${input.trim()}`)+BigInt(direction);
 if(value<1n||value>MAX_PRIVATE_KEY)throw new Error('No valid private key in this direction.');
 return value.toString(16).padStart(64,'0');
}

export function randomPrivateKeyInRange(start:string,end:string):Uint8Array {
 parsePrivateKey(start);parsePrivateKey(end);const first=BigInt(`0x${start.trim()}`);const last=BigInt(`0x${end.trim()}`);
 if(first>last)throw new Error('Start key must be less than or equal to end key.');
 const span=last-first+1n;const bits=(span-1n).toString(2).length;const size=Math.ceil(bits/8);const mask=(1n<<BigInt(bits))-1n;
 let value:bigint;do{const bytes=crypto.getRandomValues(new Uint8Array(size));value=BigInt('0x'+Array.from(bytes,b=>b.toString(16).padStart(2,'0')).join(''))&mask;}while(value>=span);
 return parsePrivateKey((first+value).toString(16).padStart(64,'0'));
}
