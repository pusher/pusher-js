describe("EventsDispatcher", function() {
  var dispatcher;

  beforeEach(function() {
    dispatcher = new Pusher.EventsDispatcher();
  });

  describe("#bind", function() {
    it("should add the listener to a specific event", function() {
      var onEvent = jasmine.createSpy("onEvent");

      dispatcher.bind("event", onEvent);
      dispatcher.emit("event", "test");
      dispatcher.emit("boop", "nope");

      expect(onEvent).toHaveBeenCalledWith("test");
      expect(onEvent.calls.length).toEqual(1);
    });
  });

  describe("#bind_all", function() {
    it("should add the listener to all events", function() {
      var onAll = jasmine.createSpy("onEvent");

      dispatcher.bind_all(onAll);
      dispatcher.emit("event", "test");
      dispatcher.emit("boop", []);

      expect(onAll).toHaveBeenCalledWith("event", "test");
      expect(onAll).toHaveBeenCalledWith("boop", []);
      expect(onAll.calls.length).toEqual(2);
    });
  });

  describe("#unbind", function() {
    it("should remove the listener", function() {
      var onEvent = jasmine.createSpy("onEvent");

      dispatcher.bind("event", onEvent);
      dispatcher.unbind("event", onEvent);
      dispatcher.emit("event");

      expect(onEvent).not.toHaveBeenCalled();
    });

    it("should remove the listener while emitting events", function() {
      var onEvent1 = jasmine.createSpy("onEvent1").andCallFake(function() {
        dispatcher.unbind("event", onEvent1);
      });
      var onEvent2 = jasmine.createSpy("onEvent2");

      dispatcher.bind("event", onEvent1);
      dispatcher.bind("event", onEvent2);

      dispatcher.emit("event");
      expect(onEvent1.calls.length).toEqual(1);
      expect(onEvent2.calls.length).toEqual(1);

      dispatcher.emit("event");
      expect(onEvent1.calls.length).toEqual(1);
      expect(onEvent2.calls.length).toEqual(2);
    });

    it("should not remove the last callback if unbinding a function that was not bound", function() {
      var onEvent = jasmine.createSpy("onEvent");
      var otherCallback = jasmine.createSpy("otherCallback");

      dispatcher.bind("event", onEvent);
      dispatcher.unbind("event", otherCallback);

      dispatcher.emit("event");
      expect(onEvent.calls.length).toEqual(1);
    });
  });

  describe("#emit", function() {
    it("should call all listeners", function() {
      var callbacks = Pusher.Util.map([1, 2, 3], function(i) {
        return jasmine.createSpy("onTest" + i);
      });
      Pusher.Util.apply(callbacks, function(callback) {
        dispatcher.bind("test", callback);
      });

      dispatcher.emit("test", { x: 1 });

      Pusher.Util.apply(callbacks, function(callback) {
        expect(callback).toHaveBeenCalledWith({ x: 1 });
      });
    });

    it("should call all global listeners", function() {
      var callbacks = Pusher.Util.map([1, 2, 3], function(i) {
        return jasmine.createSpy("onGlobal" + i);
      });
      Pusher.Util.apply(callbacks, function(callback) {
        dispatcher.bind_all(callback);
      });

      dispatcher.emit("g", { y: 2 });

      Pusher.Util.apply(callbacks, function(callback) {
        expect(callback).toHaveBeenCalledWith("g", { y: 2 });
      });
    });

    it("should call fail through function when there are no listeners for an event", function() {
      var failThrough = jasmine.createSpy("failThrough");
      var dispatcher = new Pusher.EventsDispatcher(failThrough);

      dispatcher.emit("nothing", "data");

      expect(failThrough).toHaveBeenCalledWith("nothing", "data");
    });

    it("should call fail through function after removing all event's listeners", function() {
      var failThrough = jasmine.createSpy("failThrough");
      var onEvent = jasmine.createSpy("onEvent");
      var dispatcher = new Pusher.EventsDispatcher(failThrough);

      dispatcher.bind("event", onEvent);
      dispatcher.unbind("event", onEvent);
      dispatcher.emit("event", "data");

      expect(onEvent).not.toHaveBeenCalled();
      expect(failThrough).toHaveBeenCalledWith("event", "data");
    });
  });
});
