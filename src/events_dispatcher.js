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

  prototype.bind = function(eventName, callback, context) {
    this.callbacks.add(eventName, callback, context);
    return this;
  };

  prototype.bind_all = function(callback) {
    this.global_callbacks.push(callback);
    return this;
  };

  prototype.unbind = function(eventName, callback, context) {
    this.callbacks.remove(eventName, callback, context);
    return this;
  };

  prototype.unbind_all = function(eventName, callback) {
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
        callbacks[i].fn.call(callbacks[i].context || undefined, data);
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

  CallbackRegistry.prototype.add = function(eventName, callback, context) {
    var prefixedEventName = this._prefix(eventName);
    this._callbacks[prefixedEventName] = this._callbacks[prefixedEventName] || [];
    this._callbacks[prefixedEventName].push({
      fn: callback,
      context: context
    });
  };

  CallbackRegistry.prototype.remove = function(eventName, callback, context) {
    var retain, cb, callbacks, names, i, l, j, k;

    if (!eventName && !callback && !context) {
      this._callbacks = {};
      return;
    }

    names = eventName? [this._prefix(eventName)] : Pusher.Util.keys(this._callbacks);
    for (i = 0, l = names.length; i < l; i++) {
      eventName = names[i];
      callbacks = this._callbacks[eventName];
      if (callbacks) {
        this._callbacks[eventName] = retain = [];
        if (callback || context) {
          for (j = 0, k = callbacks.length; j < k; j++) {
            cb = callbacks[j];
            if ((callback && callback !== cb.fn) || (context && context !== cb.context)) {
              retain.push(cb);
            }
          }
        }
        if (!retain.length) delete this._callbacks[eventName];
      }
    }
  };

  CallbackRegistry.prototype._prefix = function(eventName) {
    return "_" + eventName;
  };

  function arrayIndexOf(array, item) {
    var nativeIndexOf = Array.prototype.indexOf;
    if (array === null) {
      return -1;
    }
    if (nativeIndexOf && array.indexOf === nativeIndexOf) {
      return array.indexOf(item);
    }
    for (var i = 0, l = array.length; i < l; i++) {
      if (array[i] === item) {
        return i;
      }
    }
    return -1;
  }

  Pusher.EventsDispatcher = EventsDispatcher;
}).call(this);
