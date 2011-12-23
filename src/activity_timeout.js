var ActivityMonitor = function() {
  this.fns = [];

  this.onActivity = function () {
    for (i = 0, l = this.fns.length; i < l; i += 1) {
      this.fns[i]()
    }
    this.fns = [];
  }

  this.timeout = function(n, onActive, onInactive) {
    var fired = false;
    var timeout = setTimeout(function () {
      fired = true;
      onInactive();
    }, n);
    this.fns.push(function () {
      clearTimeout(timeout);
      onActive();
    })
  }
}
