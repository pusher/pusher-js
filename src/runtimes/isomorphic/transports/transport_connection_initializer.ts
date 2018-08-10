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
  } else {
    self.onClose();
  }
}
