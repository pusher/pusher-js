// The global object for the web build, resolved once. webpack/config.web.js
// points `global` in core code at this module with ProvidePlugin, so every use
// shares one value: window in browsers, self in workers, and the real global
// object in Node/SSR, where window is undefined. Only typeof checks are used,
// since referencing an undeclared global throws in older browsers.
//
// This file must not use the name `global`: ProvidePlugin would point it back
// at this module before it has loaded. globalThis is the same object in Node.
const globalObject: any =
  typeof window !== 'undefined'
    ? window
    : typeof self !== 'undefined'
      ? self
      : typeof globalThis !== 'undefined'
        ? globalThis
        : Function('return this')();

export default globalObject;

export const hasWindow = typeof window !== 'undefined';
