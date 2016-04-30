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
    if (console.warn) {
      console.warn(message);
    } else if (console.log) {
      console.log(message);
    }
    if (Pusher.log) {
      Pusher.log(message);
    }
  }
}

export default Logger;
