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
        callbacks[i].fn.call(callbacks[i].context || window, data);
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

  CallbackRegistry.prototype.get = function(name) {
    return this._callbacks[prefix(name)];
  };

  CallbackRegistry.prototype.add = function(name, callback, context) {
    var prefixedEventName = prefix(name);
    this._callbacks[prefixedEventName] = this._callbacks[prefixedEventName] || [];
    this._callbacks[prefixedEventName].push({
      fn: callback,
      context: context
    });
  };

  CallbackRegistry.prototype.remove = function(name, callback, context) {
    if (!name && !callback && !context) {
      this._callbacks = {};
      return;
    }

    var names = name ? [prefix(name)] : Pusher.Util.keys(this._callbacks);

    if (callback || context) {
      Pusher.Util.apply(names, function(name) {
        this._callbacks[name] = Pusher.Util.filter(
          this._callbacks[name] || [],
          function(binding) {
            return (callback && callback !== binding.fn) ||
                   (context && context !== binding.context);
          }
        );
        if (this._callbacks[name].length === 0) {
          delete this._callbacks[name];
        }
      }, this);
    } else {
      Pusher.Util.apply(names, function(name) {
        delete this._callbacks[name];
      }, this);
    }
  };

  function prefix(name) {
    return "_" + name;
  }

  Pusher.EventsDispatcher = EventsDispatcher;
}).call(this);
