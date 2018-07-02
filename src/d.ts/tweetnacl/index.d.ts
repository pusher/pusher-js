interface secretbox {
  (data: any, nonce: any, key: any): any;
  overheadLength: number;
  nonceLength: number;
  open(data: any, nonce: any, key: any): any;
}

declare module "tweetnacl" {
  var secretbox: secretbox;
  export function randomBytes(num: any): any;
}
