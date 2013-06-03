;(function() {
  /** Extends public channels to provide private channel interface.
   *
   * @param {String} name
   * @param {Pusher} pusher
   */
  function PrivateChannel(name, pusher) {
    Pusher.Channel.call(this, name, pusher);
  }
  var prototype = PrivateChannel.prototype;
  Pusher.Util.extend(prototype, Pusher.Channel.prototype);

  /** Authorizes the connection to use the channel.
   *
   * @param  {String} socketId
   * @param  {Object} options authorizer options
   * @param  {Function} callback
   */
  prototype.authorize = function(socketId, options, callback) {
    var authorizer = new Pusher.Channel.Authorizer(
      this, Pusher.Util.extend({}, this.pusher.options, options)
    );
    return authorizer.authorize(socketId, callback);
  };

  Pusher.PrivateChannel = PrivateChannel;
}).call(this);
