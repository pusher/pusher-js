;(function() {
  /** Base class for all non-transport strategies.
   *
   * @param {Array} substrategies list of children strategies
   */
  function MultiStrategy(strategies, options) {
    this.strategies = Pusher.MultiStrategy.filterUnsupported(strategies);
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
    return this.strategies.length > 0;
  };

  /** Returns an object with strategy's options
   *
   * @returns {Object}
   */
  prototype.getOptions = function() {
    return this.options;
  };

  Pusher.MultiStrategy = MultiStrategy;
}).call(this);
