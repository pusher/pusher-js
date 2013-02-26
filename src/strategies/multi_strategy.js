;(function() {
  /** Base class for strategies that have multiple children.
   *
   * @param {Strategy[]} strategies
   * @param {Object} options
   */
  function MultiStrategy(strategies, options) {
    this.strategies = strategies;
    this.options = options || {};
  }
  var prototype = MultiStrategy.prototype;

  MultiStrategy.filterUnsupported = function(strategies) {
    return Pusher.Util.filter(strategies, Pusher.Util.method("isSupported"));
  };

  prototype.isSupported = function() {
    return Pusher.Util.any(this.strategies, Pusher.Util.method("isSupported"));
  };

  Pusher.MultiStrategy = MultiStrategy;
}).call(this);
