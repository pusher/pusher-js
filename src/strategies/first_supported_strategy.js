;(function() {
  /** Takes the first supported substrategy and uses it to establish connection.
   *
   * @param {Array} substrategies
   */
  function FirstSupportedStrategy(substrategies) {
    Pusher.FirstConnectedStrategy.call(this, substrategies);
  }
  var prototype = FirstSupportedStrategy.prototype;

  Pusher.Util.extend(prototype, Pusher.FirstConnectedStrategy.prototype);

  prototype.name = "first_supported";

  /** @protected */
  prototype.getSupported = function(substrategies) {
    for (var i = 0; i < substrategies.length; i++) {
      if (substrategies[i].isSupported()) {
        return [substrategies[i]];
      }
    }
    return [];
  };

  Pusher.FirstSupportedStrategy = FirstSupportedStrategy;
}).call(this);
