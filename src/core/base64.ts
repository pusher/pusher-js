export default function encode (s : any) : string {
  return btoa(utob(s));
}

var fromCharCode = String.fromCharCode;

var b64chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
var b64tab = {};

for (var i = 0, l = b64chars.length; i < l; i++) {
  b64tab[b64chars.charAt(i)] = i;
}

var cb_utob = function(c) {
  var cc = c.charCodeAt(0);
  return cc < 0x80 ? c
      : cc < 0x800 ? fromCharCode(0xc0 | (cc >>> 6)) +
                     fromCharCode(0x80 | (cc & 0x3f))
      : fromCharCode(0xe0 | ((cc >>> 12) & 0x0f)) +
        fromCharCode(0x80 | ((cc >>>  6) & 0x3f)) +
        fromCharCode(0x80 | ( cc         & 0x3f));
};

var utob = function(u) {
  return u.replace(/[^\x00-\x7F]/g, cb_utob);
};

var cb_encode = function(ccc) {
  var padlen = [0, 2, 1][ccc.length % 3];
  var ord = ccc.charCodeAt(0) << 16
    | ((ccc.length > 1 ? ccc.charCodeAt(1) : 0) << 8)
    | ((ccc.length > 2 ? ccc.charCodeAt(2) : 0));
  var chars = [
    b64chars.charAt( ord >>> 18),
    b64chars.charAt((ord >>> 12) & 63),
    padlen >= 2 ? '=' : b64chars.charAt((ord >>> 6) & 63),
    padlen >= 1 ? '=' : b64chars.charAt(ord & 63)
  ];
  return chars.join('');
};

var btoa = global.btoa || function(b) {
  return b.replace(/[\s\S]{1,3}/g, cb_encode);
};
