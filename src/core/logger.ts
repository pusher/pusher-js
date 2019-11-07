import { stringify } from './utils/collections';
import Pusher from './pusher';

function globalLog(message) {
  if (global.console && global.console.log) {
    global.console.log(message);
  }
}

function globalLogWarn(message) {
  if (global.console && global.console.warn) {
    global.console.warn(message);
  } else {
    globalLog(message);
  }
}

function globalLogError(message) {
  if (global.console && global.console.error) {
    global.console.error(message);
  } else {
    globalLogWarn(message);
  }
}

function log(defaultLoggingFunction, ...args: any[]) {
  var message = stringify.apply(this, arguments);
  if (Pusher.log) {
    Pusher.log(message);
  } else if (Pusher.logToConsole) {
    defaultLoggingFunction(message);
  }
}

const Logger = {
  debug(...args: any[]) {
    log(globalLog, args);
  },
  warn(...args: any[]) {
    log(globalLogWarn, args);
  },
  error(...args: any[]) {
    log(globalLogError, args);
  }
};

export default Logger;
