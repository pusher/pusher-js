interface secretbox {
  (data: Uint8Array, nonce: Uint8Array, key: Uint8Array): Uint8Array;
  overheadLength: number;
  nonceLength: number;
  open(data: Uint8Array, nonce: Uint8Array, key: Uint8Array): Uint8Array;
}

declare module "tweetnacl" {
  var secretbox: secretbox;
  export function randomBytes(num: number): Uint8Array;
}
