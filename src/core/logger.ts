import { stringify } from './utils/collections';
import Pusher from './pusher';

const Logger = {
  debug(...args: any[]) {
    var message = stringify.apply(this, arguments);
    if (Pusher.log) {
      Pusher.log(message);
    } else if (Pusher.logToConsole && global.console) {
      if (global.console.log) {
        global.console.log(message);
      }
    }
  },
  warn(...args: any[]) {
    var message = stringify.apply(this, arguments);
    if (Pusher.log) {
      Pusher.log(message);
    } else if (Pusher.logToConsole && global.console) {
      if (global.console.warn) {
        global.console.warn(message);
      } else if (global.console.log) {
        global.console.log(message);
      }
    }
  },
  error(...args: any[]) {
    var message = stringify.apply(this, arguments);
    if (Pusher.log) {
      Pusher.log(message);
    } else if (Pusher.logToConsole && global.console) {
      if (global.console.error) {
        global.console.error(message);
      } else if (global.console.warn) {
        global.console.warn(message);
      } else if (global.console.log) {
        global.console.log(message);
      }
    }
  }
};

export default Logger;
