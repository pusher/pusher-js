;(function() {
  /** Base class for all strategies.
   *
   * @param {Array} substrategies list of children strategies
   */
  function Strategy(strategies) {
    this.strategies = strategies;
  }
  var prototype = Strategy.prototype;

  Strategy.filterUnsupported = function(strategies) {
    return Pusher.Util.filter(strategies, Pusher.Util.method("isSupported"));
  };

  /** Returns whether there are any supported substrategies.
   *
   * @returns {Boolean}
   */
  prototype.isSupported = function() {
    return this.strategies.length > 0;
  };

  /** Makes an encrypted-only copy of itself.
   *
   * @returns {AbstractMultiStrategy}
   */
  prototype.getEncrypted = function() {
    return new this.constructor(
      Pusher.Util.map(this.strategies, Pusher.Util.method("getEncrypted")),
      this.getOptions()
    );
  };

  prototype.getOptions = function() {
    return {};
  };

  Pusher.Strategy = Strategy;
}).call(this);
