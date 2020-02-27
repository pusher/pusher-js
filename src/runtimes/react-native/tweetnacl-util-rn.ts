import * as base64 from '@stablelib/base64';
import * as utf8 from '@stablelib/utf8';

export const encodeUTF8 = utf8.decode;
export const decodeUTF8 = utf8.encode;
export const encodeBase64 = base64.encode;
export const decodeBase64 = base64.decode;
