;(function(exports) {

  // MSIE doesn't have array.indexOf
  var nativeIndexOf = Array.prototype.indexOf;
  exports.indexOf = function indexOf(array, item) {
    if (array == null) return -1;
    if (nativeIndexOf && array.indexOf === nativeIndexOf) return array.indexOf(item);
    for (i = 0, l = array.length; i < l; i++) if (array[i] === item) return i;
    return -1;
  }

  /**
   * EventsWatcher is a constructor that'll listen for all
   * given possible events and allow you to be able to
   * write asserts that check if an event was emitted
   *
   * @constructor
   * @param {Pusher.EventsDispatcher} subject The object that will emit the events.
   * @param {Array} possibleEvents The events we care about for our testcase.
  **/
  exports.EventsWatcher = function EventsWatcher(subject, possibleEvents) {
    var events = [];

    this.length = function() {
      return events.length;
    };

    this.next = function() {
      return events.shift();
    };

    subject.bind_all(function(event_name, data) {
      if (indexOf(possibleEvents, event_name) > -1) {
        if (arguments.length > 1) {
          events.push({name: event_name, data: data});
        } else {
          events.push({name: event_name});
        }
      }
      // console.log('addEvent', events, event_name, data, indexOf(possibleEvents, event_name));
    });
  }

  /**
   * SteppedObserver is a constructor that will bind to a given event and
   * step through a list of callback functions. (One step per emit of event).
   *
   * @constructor
   * @param {Object} subject     The object that will emit the events.
   * @param {String} event_name  The event we wish to observe in a stepped manner.
   * @param {Array}  callbacks   The callbacks to step through.
  **/
  exports.SteppedObserver = function SteppedObserver(subject, event_name, callbacks) {
    var numberOfChanges = 0,
        numberOfCallbacks = callbacks.length;

    subject.bind(event_name, function(event_data) {
      if (numberOfChanges < numberOfCallbacks) {
        var callback = callbacks[numberOfChanges++];

        if (typeof callback === 'function') {
          callback(event_data);
        }
      }
    });
  }

  exports.mock = {};

  exports.mock.log = {};
  exports.mock.log.LogMock = function LogMock() {
    this.messages = {};
    var self = this;

    var persistLogFn = function() {
      var log = arguments[0];
      if(self.messages[log] === undefined) {
        self.messages[log] = [];
      }

      self.messages[log].push(Pusher.Util.stringify(arguments));
    };

    // stored outside obj so LogMock can be reinstantiated and the restore still works
    if(exports.mock.log.oldWarn === undefined && exports.mock.log.oldDebug === undefined) {
      exports.mock.log.oldWarn = Pusher.warn;
      exports.mock.log.oldDebug = Pusher.debug;
    }

    Pusher.warn = persistLogFn;
    Pusher.debug = persistLogFn;
  };

  exports.mock.log.LogMock.prototype = {
    // restore normal logging behaviour
    restore: function() {
      Pusher.warn = exports.mock.log.oldWarn;
      Pusher.debug = exports.mock.log.oldDebug;
    }
  };

  /**
   * defer is a utility method to create a very short timeout as to be able
   * to run code in the "nextTick"
   *
   * @param {Function}  callback    The callback to run on "nextTick".
   * @param {Object}    thisArg     The scope to call the callback in.
   * @param {Array}     args        Optional arguments to call the callback with.
  **/
  exports.defer = function defer(callback, thisArg, args) {
    return setTimeout(function() {
      callback.apply(thisArg, (args || []));
    }, 10);
  }
})(this);