import {stringify} from './utils/collections';
import Pusher from './pusher';

const Logger = {
  debug(...args : any[]) {
    if (!Pusher.log) {
      return
    }
    Pusher.log(stringify.apply(this, arguments));
  },
  warn(...args : any[]) {
    var message = stringify.apply(this, arguments);
    if (Pusher.log) {
      Pusher.log(message);
    } else if (global.console) {
      if (global.console.warn) {
        global.console.warn(message);
      } else if (global.console.log) {
        global.console.log(message);
      }
    }
  }
}

export default Logger;
