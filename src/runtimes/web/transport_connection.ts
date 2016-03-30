import {Dependencies} from './dom/dependencies';

/** Provides universal API for transport connections.
 *
 * Transport connection is a low-level object that wraps a connection method
 * and exposes a simple evented interface for the connection state and
 * messaging. It does not implement Pusher-specific WebSocket protocol.
 *
 * Additionally, it fetches resources needed for transport to work and exposes
 * an interface for querying transport features.
 *
 * States:
 * - new - initial state after constructing the object
 * - initializing - during initialization phase, usually fetching resources
 * - intialized - ready to establish a connection
 * - connection - when connection is being established
 * - open - when connection ready to be used
 * - closed - after connection was closed be either side
 *
 * Emits:
 * - error - after the connection raised an error
 *
 * Options:
 * - encrypted - whether connection should use ssl
 * - hostEncrypted - host to connect to when connection is encrypted
 * - hostUnencrypted - host to connect to when connection is not encrypted
 *
 * @param {String} key application key
 * @param {Object} options
 */
export default class BrowserTransportConnection extends IsomorphicTransportConnection {

  /** Initializes the transport.
   *
   * Fetches resources if needed and then transitions to initialized.
   */
  initialize() {
    var self = this;

    self.timeline.info(self.buildTimelineMessage({
      transport: self.name + (self.options.encrypted ? "s" : "")
    }));

    if (self.hooks.isInitialized()) {
      self.changeState(ConnectionState.INITIALIZED);
    } else if (self.hooks.file) {
      self.changeState(ConnectionState.INITIALIZING);
      Dependencies.load(
        self.hooks.file,
        { encrypted: self.options.encrypted },
        function(error, callback) {
          if (self.hooks.isInitialized()) {
            self.changeState(ConnectionState.INITIALIZED);
            callback(true);
          } else {
            if (error) {
              self.onError(error);
            }
            self.onClose();
            callback(false);
          }
        }
      );
    } else {
      self.onClose();
    }
  }
}
