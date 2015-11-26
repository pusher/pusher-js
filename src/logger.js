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
    if (window.console) {
      if (window.console.warn) {
        window.console.warn(message);
      } else if (window.console.log) {
        window.console.log(message);
      }
    }
    if (this.log) {
      this.log(message);
    }   
  }
}