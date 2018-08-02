declare module "tweetnacl-util" {
  export function encodeUTF8(data: Uint8Array): string;
  export function decodeUTF8(data: string): Uint8Array;
  export function encodeBase64(data: Uint8Array): string;
  export function decodeBase64(data: string): Uint8Array;
}
