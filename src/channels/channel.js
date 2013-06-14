;(function() {
  /** Provides base public channel interface with an event emitter.
   *
   * Emits:
   * - pusher:subscription_succeeded - after subscribing successfully
   * - other non-internal events
   *
   * @param {String} name
   * @param {Pusher} pusher
   */
  function Channel(name, pusher) {
    Pusher.EventsDispatcher.call(this, function(event, data) {
      Pusher.debug('No callbacks on ' + name + ' for ' + event);
    });

    this.name = name;
    this.pusher = pusher;
    this.subscribed = false;
  }
  var prototype = Channel.prototype;
  Pusher.Util.extend(prototype, Pusher.EventsDispatcher.prototype);

  /** Skips authorization, since public channels don't require it.
   *
   * @param {Function} callback
   */
  prototype.authorize = function(socketId, callback) {
    return callback(false, {});
  };

  /** Triggers an event */
  prototype.trigger = function(event, data) {
    return this.pusher.send_event(event, data, this.name);
  };

  /** Signals disconnection to the channel. For internal use only. */
  prototype.disconnect = function() {
    this.subscribed = false;
  };

  /** Handles an event. For internal use only.
   *
   * @param {String} event
   * @param {*} data
   */
  prototype.handleEvent = function(event, data) {
    if (event.indexOf("pusher_internal:") === 0) {
      if (event === "pusher_internal:subscription_succeeded") {
        this.subscribed = true;
        this.emit("pusher:subscription_succeeded", data);
      }
    } else {
      this.emit(event, data);
    }
  };

  Pusher.Channel = Channel;
}).call(this);
