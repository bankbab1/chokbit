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
