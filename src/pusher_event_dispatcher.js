;(function() {
/* Abstract event binding
Example:

    var MyEventEmitter = function(){};
    MyEventEmitter.prototype = new Pusher.EventsDispatcher;

    var emitter = new MyEventEmitter();

    // Bind to single event
    emitter.bind('foo_event', function(data){ alert(data)} );

    // Bind to all
    emitter.bind_all(function(event_name, data){ alert(data) });

--------------------------------------------------------*/
  function EventsDispatcher(failThrough) {
    this.callbacks = {};
    this.global_callbacks = [];
    // Run this function when dispatching an event when no callbacks defined
    this.failThrough = failThrough;
  }

  EventsDispatcher.prototype.bind = function(event_name, callback) {
    this.callbacks[event_name] = this.callbacks[event_name] || [];
    this.callbacks[event_name].push(callback);
    return this;// chainable
  };
  
  EventsDispatcher.prototype.unbind = function(eventName, callback) {
    if(this.callbacks[eventName]) {
      var index = Pusher.Util.arrayIndexOf(this.callbacks[eventName], callback);
      this.callbacks[eventName].splice(index, 1);
    }
    return this;
  };

  EventsDispatcher.prototype.emit = function(event_name, data) {
    // Global callbacks
    for (var i = 0; i < this.global_callbacks.length; i++) {
      this.global_callbacks[i](event_name, data);
    }

    // Event callbacks
    var callbacks = this.callbacks[event_name];
    if (callbacks) {
      for (var i = 0; i < callbacks.length; i++) {
        callbacks[i](data);
      }
    } else if (this.failThrough) {
      this.failThrough(event_name, data)
    }

    return this;
  };

  EventsDispatcher.prototype.bind_all = function(callback) {
    this.global_callbacks.push(callback);
    return this;
  };

  this.Pusher.EventsDispatcher = EventsDispatcher;
}).call(this);
