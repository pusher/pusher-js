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
    if (console.warn) {
      console.warn(message);
    } else if (console.log) {
      console.log(message);
    }
    if (this.log) {
      this.log(message);
    }
  }
}
