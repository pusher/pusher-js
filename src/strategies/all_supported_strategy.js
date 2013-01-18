;(function() {
  /** First connected strategy, but supported only when all substrategies are.
   *
   * @param {Array} substrategies
   */
  function AllSupportedStrategy(substrategies) {
    Pusher.FirstConnectedStrategy.call(this, substrategies);
  }
  var prototype = AllSupportedStrategy.prototype;

  Pusher.Util.extend(prototype, Pusher.FirstConnectedStrategy.prototype);

  prototype.name = "all_supported";

  /** Returns whether all of substrategies are supported.
   *
   * @returns {Boolean}
   */
  prototype.isSupported = function() {
    return Pusher.Util.all(this.strategies, Pusher.Util.method("isSupported"));
  };

  Pusher.AllSupportedStrategy = AllSupportedStrategy;
}).call(this);
