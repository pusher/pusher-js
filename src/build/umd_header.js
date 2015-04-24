// Uses Node, AMD or browser globals to create a module. This example creates
// a global even when AMD is used. This is useful if you have some scripts
// that are loaded by an AMD loader, but they still want access to globals.
// If you do not need to export a global for the AMD case,
// see returnExports.js.

// If you want something that will work in other stricter CommonJS environments,
// or if you need to create a circular dependency, see commonJsStrictGlobal.js

// Defines a module "Pusher".

(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define([], function () {
      return (root.Pusher = factory());
    });
  } else if (typeof exports === 'object') {
    // Node. Does not work with strict CommonJS, but
    // only CommonJS-like enviroments that support module.exports,
    // like Node.
    module.exports = factory();
  } else {
    // Browser globals
    root.Pusher = factory();
  }
}(this, function () {
