;(function() {
  /** Base class for all strategies having multiple children (substrategies).
   *
   * @param {Array} substrategies list of substrategies
   */
  function AbstractMultiStrategy(substrategies) {
    this.substrategies = this.getSupported(substrategies);
  }
  var prototype = AbstractMultiStrategy.prototype;

  /** Returns whether there are any supported substrategies.
   *
   * @returns {Boolean}
   */
  prototype.isSupported = function() {
    return this.substrategies.length > 0;
  };

  /** Makes an encrypted-only copy of itself.
   *
   * @returns {AbstractMultiStrategy}
   */
  prototype.getEncrypted = function() {
    var substrategies = [];
    for (var i = 0; i < this.substrategies.length; i++) {
      substrategies.push(this.substrategies[i].getEncrypted());
    }
    return new this.constructor(substrategies);
  };

  /** @protected */
  prototype.getSupported = function(substrategies) {
    var supported = [];
    for (var i = 0; i < substrategies.length; i++) {
      if (substrategies[i].isSupported()) {
        supported.push(substrategies[i]);
      }
    }
    return supported;
  };

  Pusher.AbstractMultiStrategy = AbstractMultiStrategy;
}).call(this);
