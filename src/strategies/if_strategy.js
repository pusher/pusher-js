;(function() {
  /** Proxies method calls to one of substrategies basing on the test function.
   *
   * @param {Function} test
   * @param {Strategy} trueBranch strategy used when test returns true
   * @param {Strategy} falseBranch strategy used when test returns false
   */
  function IfStrategy(test, trueBranch, falseBranch) {
    this.test = test;
    this.trueBranch = trueBranch;
    this.falseBranch = falseBranch;
  }
  var prototype = IfStrategy.prototype;

  prototype.isSupported = function() {
    var branch = this.test() ? this.trueBranch : this.falseBranch;
    return branch.isSupported();
  };

  prototype.connect = function(minPriority, callback) {
    var branch = this.test() ? this.trueBranch : this.falseBranch;
    return branch.connect(minPriority, callback);
  };

  Pusher.IfStrategy = IfStrategy;
}).call(this);
