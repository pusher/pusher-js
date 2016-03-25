import {stringify} from './utils/collections';

var Logger = {
  log: null,
  debug(...args : any[]) {
    if (!this.log) {
      return
    }
    this.log(stringify.apply(this, arguments));
  },
  warn(...args : any[]) {
    var message = stringify.apply(this, arguments);
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

export default Logger;
