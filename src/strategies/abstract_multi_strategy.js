;(function() {

  function AbstractMultiStrategy(substrategies, options) {
    Pusher.AbstractStrategy.call(this, options);
    this.substrategies = this.getSupported(substrategies);
  };
  var prototype = AbstractMultiStrategy.prototype;

  Pusher.Util.extend(prototype, Pusher.AbstractStrategy.prototype);

  // interface

  prototype.isSupported = function() {
    return this.substrategies.length > 0;
  };

  prototype.initialize = function() {
    for (var i = 0; i < this.substrategies.length; i++) {
      this.substrategies[i].initialize();
    }
  };

  // protected

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
