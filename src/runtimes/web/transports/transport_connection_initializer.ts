import {Dependencies} from '../dom/dependencies';

/** Initializes the transport.
 *
 * Fetches resources if needed and then transitions to initialized.
 */
export default function() {
  var self = this;

  self.timeline.info(self.buildTimelineMessage({
    transport: self.name + (self.options.useTLS ? "s" : "")
  }));

  if (self.hooks.isInitialized()) {
    self.changeState("initialized");
  } else if (self.hooks.file) {
    self.changeState("initializing");
    Dependencies.load(
      self.hooks.file,
      { useTLS: self.options.useTLS },
      function(error, callback) {
        if (self.hooks.isInitialized()) {
          self.changeState("initialized");
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
