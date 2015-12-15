var global = require('./global');
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
    if (global.console) {
      if (global.console.warn) {
        global.console.warn(message);
      } else if (global.console.log) {
        global.console.log(message);
      }
    }
    if (this.log) {
      this.log(message);
    }
  }
}
