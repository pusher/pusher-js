;(function() {
  /** Takes the first supported substrategy and uses it to establish connection.
   *
   * @param {Array} substrategies
   */
  function FirstSupportedStrategy(substrategies) {
    Pusher.FirstConnectedStrategy.call(
      this, Pusher.Strategy.filterUnsupported(substrategies).slice(0, 1)
    );
  }
  var prototype = FirstSupportedStrategy.prototype;

  Pusher.Util.extend(prototype, Pusher.FirstConnectedStrategy.prototype);

  prototype.name = "first_supported";

  Pusher.FirstSupportedStrategy = FirstSupportedStrategy;
}).call(this);
