import {Dependencies} from '../dom/dependencies';
import ConnectionState from 'core/connection/state';

/** Initializes the transport.
 *
 * Fetches resources if needed and then transitions to initialized.
 */
export default function() {
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
