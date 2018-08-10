import Factory from "../utils/factory";
import Util from '../util';
import * as Errors from '../errors';
import * as Collections from '../utils/collections';
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
  options: StrategyOptions;

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
      useTLS: this.options.useTLS
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
      handshake = Factory.createHandshake(transport, function(result) {
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
      var serializedTransport;

      // The reason for this try/catch block is that on React Native
      // the WebSocket object is circular. Therefore transport.socket will
      // throw errors upon stringification. Collections.safeJSONStringify
      // discards circular references when serializing.
      serializedTransport = Collections.safeJSONStringify(transport);
      callback(new Errors.TransportClosed(serializedTransport));
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
      abort: ()=> {
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
      forceMinPriority: (p)=> {
        if (connected) {
          return;
        }
        if (this.priority < p) {
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
