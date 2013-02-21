;(function() {
  /** Base class for all non-transport strategies.
   *
   * @param {Array} substrategies list of children strategies
   */
  function MultiStrategy(strategies, options) {
    this.strategies = strategies;
    this.options = options || {};
  }
  var prototype = MultiStrategy.prototype;

  MultiStrategy.filterUnsupported = function(strategies) {
    return Pusher.Util.filter(strategies, Pusher.Util.method("isSupported"));
  };

  /** Returns whether there are any supported substrategies.
   *
   * @returns {Boolean}
   */
  prototype.isSupported = function() {
    return Pusher.Util.any(this.strategies, Pusher.Util.method("isSupported"));
  };

  Pusher.MultiStrategy = MultiStrategy;
}).call(this);
