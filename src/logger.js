var Util = require('./util');

module.exports = {
  debug: function(){
    if (!this.log) {
      return
    }
    this.log(Util.stringify.apply(this, arguments));
  },

  warn: function(){
    var message = Util.stringify.apply(this, arguments);
    var _global = Util.getGlobal();
    if (_global.console) {
      if (_global.console.warn) {
        _global.console.warn(message);
      } else if (_global.console.log) {
        _global.console.log(message);
      }
    }
    if (this.log) {
      this.log(message);
    }   
  }
}