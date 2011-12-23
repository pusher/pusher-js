;(function(){
  runner.addSuite('event_dispatcher', {
    'Can create EventsDispatcher': function(test) {
      test.numAssertions = 1;

      var eventDispatcher = new Pusher.EventsDispatcher();
      test.ok(eventDispatcher instanceof Pusher.EventsDispatcher)
      test.finish();
    },
    'Can bind to an event': function(test) {
        test.numAssertions = 2;
        
        var eventDispatcher = new Pusher.EventsDispatcher();
        var callback = function() {};
        eventDispatcher.bind('test_event', callback);
        
        test.equal(1, eventDispatcher.callbacks['test_event'].length);
        test.equal(callback, eventDispatcher.callbacks['test_event'][0]);
        
        test.finish();
    },
    'emit triggers event': function(test) {
        test.numAssertions = 1;
        
        var eventDispatcher = new Pusher.EventsDispatcher();
        var callbackCalled = false;
        var callback = function() {
          callbackCalled = true;
        };
        eventDispatcher.bind('test_event', callback);
        
        eventDispatcher.emit('test_event', {some:'data'});
        
        test.ok(callbackCalled)
        
        test.finish();
    },
    'expected data is sent when event emitted': function(test) {
      test.numAssertions = 1;

      var eventDispatcher = new Pusher.EventsDispatcher();
      var expectedData = {some: 'data'};
      var actualData = null;
      var callback = function(data) {
        actualData = data;
      };
      eventDispatcher.bind('test_event', callback);

      eventDispatcher.emit('test_event', expectedData);

      test.equal(expectedData, actualData);

      test.finish();
    },
    'Can unbind from an event': function(test) {
      test.numAssertions = 2;
      
      var eventDispatcher = new Pusher.EventsDispatcher();
      
      var callbackCalled = false;
      var callback = function() {
        callbackCalled = true;
      };
      eventDispatcher.bind('test_event', callback);
      
      test.equal(1, eventDispatcher.callbacks['test_event'].length);
      
      eventDispatcher.unbind('test_event', callback);
      
      eventDispatcher.emit('test_event', {});      
      test.equal(callbackCalled, false, "Unbound callback should not have been called.");
      
      test.finish();
    }
  });
})();