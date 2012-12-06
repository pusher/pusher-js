;(function() {

  function AbstractMultiStrategy(substrategies) {
    Pusher.EventsDispatcher.call(this);
    this.substrategies = this.getSupported(substrategies);
  }
  var prototype = AbstractMultiStrategy.prototype;

  Pusher.Util.extend(prototype, Pusher.EventsDispatcher.prototype);

  // interface

  prototype.isSupported = function() {
    return this.substrategies.length > 0;
  };

  prototype.forceSecure = function(value) {
    for (var i = 0; i < this.substrategies.length; i++) {
      this.substrategies[i].forceSecure(value);
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
