;(function() {
  /** Manages callback bindings and event emitting.
   *
   * @param Function failThrough called when no listeners are bound to an event
   */
  function EventsDispatcher(failThrough) {
    this.callbacks = new CallbackRegistry();
    this.global_callbacks = [];
    this.failThrough = failThrough;
  }
  var prototype = EventsDispatcher.prototype;

  prototype.bind = function(eventName, callback) {
    this.callbacks.add(eventName, callback);
    return this;
  };

  prototype.bind_all = function(callback) {
    this.global_callbacks.push(callback);
    return this;
  };

  prototype.unbind = function(eventName, callback) {
    this.callbacks.remove(eventName, callback);
    return this;
  };

  prototype.emit = function(eventName, data) {
    var i;

    for (i = 0; i < this.global_callbacks.length; i++) {
      this.global_callbacks[i](eventName, data);
    }

    var callbacks = this.callbacks.get(eventName);
    if (callbacks && callbacks.length > 0) {
      for (i = 0; i < callbacks.length; i++) {
        callbacks[i](data);
      }
    } else if (this.failThrough) {
      this.failThrough(eventName, data);
    }

    return this;
  };

  /** Callback registry helper. */

  function CallbackRegistry() {
    this._callbacks = {};
  }

  CallbackRegistry.prototype.get = function(eventName) {
    return this._callbacks[this._prefix(eventName)];
  };

  CallbackRegistry.prototype.add = function(eventName, callback) {
    var prefixedEventName = this._prefix(eventName);
    this._callbacks[prefixedEventName] = this._callbacks[prefixedEventName] || [];
    this._callbacks[prefixedEventName].push(callback);
  };

  CallbackRegistry.prototype.remove = function(eventName, callback) {
    if(this.get(eventName)) {
      var index = Pusher.Util.arrayIndexOf(this.get(eventName), callback);
      if (index !== -1){
        var callbacksCopy = this._callbacks[this._prefix(eventName)].slice(0);
        callbacksCopy.splice(index, 1);
        this._callbacks[this._prefix(eventName)] = callbacksCopy;
      }
    }
  };

  CallbackRegistry.prototype._prefix = function(eventName) {
    return "_" + eventName;
  };

  Pusher.EventsDispatcher = EventsDispatcher;
}).call(this);
