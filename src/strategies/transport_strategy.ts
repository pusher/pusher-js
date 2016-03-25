import * as Util from '../util';
import * as Errors from '../errors';
import Strategy from './strategy';
import Transport from '../transports/transport';
import StrategyOptions from './strategy_options';
import Handshake from "../connection/handshake";

/** Provides a strategy interface for transports.
 *
 * @param {String} name
 * @param {Number} priority
 * @param {Class} transport
 * @param {Object} options
 */
export default class TransportStrategy implements Strategy {
  name: string;
  priority: number;
  transport: Transport;
  options: any;

  constructor(name : string, priority : number, transport : Transport, options : StrategyOptions) {
    this.name = name;
    this.priority = priority;
    this.transport = transport;
    this.options = options || {};
  }

  /** Returns whether the transport is supported in the browser.
   *
   * @returns {Boolean}
   */
  isSupported() : boolean {
    return this.transport.isSupported({
      encrypted: this.options.encrypted
    });
  }

  /** Launches a connection attempt and returns a strategy runner.
   *
   * @param  {Function} callback
   * @return {Object} strategy runner
   */
  connect(minPriority : number, callback : Function) {
    if (!this.isSupported()) {
      return failAttempt(new Errors.UnsupportedStrategy(), callback);
    } else if (this.priority < minPriority) {
      return failAttempt(new Errors.TransportPriorityTooLow(), callback);
    }

    var self = this;
    var connected = false;

    var transport = this.transport.createConnection(
      this.name, this.priority, this.options.key, this.options
    );
    var handshake = null;

    var onInitialized = function() {
      transport.unbind("initialized", onInitialized);
      transport.connect();
    };
    var onOpen = function() {
      handshake = new Handshake(transport, function(result) {
        connected = true;
        unbindListeners();
        callback(null, result);
      });
    };
    var onError = function(error) {
      unbindListeners();
      callback(error);
    };
    var onClosed = function() {
      unbindListeners();
      callback(new Errors.TransportClosed(JSON.stringify(transport)));
    };

    var unbindListeners = function() {
      transport.unbind("initialized", onInitialized);
      transport.unbind("open", onOpen);
      transport.unbind("error", onError);
      transport.unbind("closed", onClosed);
    };

    transport.bind("initialized", onInitialized);
    transport.bind("open", onOpen);
    transport.bind("error", onError);
    transport.bind("closed", onClosed);

    // connect will be called automatically after initialization
    transport.initialize();

    return {
      abort: function() {
        if (connected) {
          return;
        }
        unbindListeners();
        if (handshake) {
          handshake.close();
        } else {
          transport.close();
        }
      },
      forceMinPriority: function(p) {
        if (connected) {
          return;
        }
        if (self.priority < p) {
          if (handshake) {
            handshake.close();
          } else {
            transport.close();
          }
        }
      }
    };
  }
}

function failAttempt(error : Error, callback : Function) {
  Util.defer(function() {
    callback(error);
  });
  return {
    abort: function() {},
    forceMinPriority: function() {}
  };
}
