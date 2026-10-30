/**
 * Runs fn with the named global function replaced by a no-op, then restores
 * it, even if fn throws. Jasmine doesn't allow spying on the mock clock's
 * functions, so this replaces them directly.
 *
 * @param {string} name e.g. "clearTimeout"
 * @param {Function} fn
 */
module.exports = function withBrokenGlobal(name, fn) {
  var original = global[name];
  global[name] = function() {};
  try {
    fn();
  } finally {
    global[name] = original;
  }
};
