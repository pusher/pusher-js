;(function() {
  /** Proxies method calls to one of substrategies basing on the test function.
   *
   * @param {Function} test
   * @param {Strategy} trueBranch
   * @param {Strategy} falseBranch
   */
  function IfStrategy(test, trueBranch, falseBranch) {
    this.test = test;
    this.trueBranch = trueBranch;
    this.falseBranch = falseBranch;
    this.options = {};
  }
  var prototype = IfStrategy.prototype;

  prototype.isSupported = function() {
    var branch = this.test() ? this.trueBranch : this.falseBranch;
    return branch.isSupported();
  };

  prototype.connect = function(callback) {
    var branch = this.test() ? this.trueBranch : this.falseBranch;
    return branch.connect(callback);
  };

  Pusher.IfStrategy = IfStrategy;
}).call(this);
