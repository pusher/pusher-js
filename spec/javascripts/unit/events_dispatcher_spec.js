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

    it("should add the same listener to a specific event several times", function() {
      var onEvent = jasmine.createSpy("onEvent");

      dispatcher.bind("event", onEvent);
      dispatcher.bind("event", onEvent);
      dispatcher.emit("event", "test");

      expect(onEvent).toHaveBeenCalledWith("test");
      expect(onEvent.calls.length).toEqual(2);
    });

    it("should add the listener with different contexts", function() {
      var onEvent = jasmine.createSpy("onEvent");

      dispatcher.bind("event", onEvent);
      dispatcher.bind("event", onEvent, this);
      dispatcher.bind("event", onEvent, {});
      dispatcher.emit("event", "test");

      expect(onEvent).toHaveBeenCalledWith("test");
      expect(onEvent.calls.length).toEqual(3);
    });
  });

  describe("#bind_all", function() {
    it("should add the listener to all events", function() {
      var onAll = jasmine.createSpy("onAll");

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

    it("should remove all listeners on omitted arguments", function() {
      var onEvent = jasmine.createSpy("onEvent");

      dispatcher.bind("event", onEvent);
      dispatcher.unbind();
      dispatcher.emit("event");

      expect(onEvent).not.toHaveBeenCalled();
    });

    it("should remove listener if only event name is given", function() {
      var onEvent = jasmine.createSpy("onEvent");

      dispatcher.bind("event", onEvent);
      dispatcher.unbind("event");
      dispatcher.emit("event");

      expect(onEvent).not.toHaveBeenCalled();
    });

    it("should remove listener with context if only event name is given", function() {
      var onEvent = jasmine.createSpy("onEvent");
      var context = {};

      dispatcher.bind("event", onEvent, context);
      dispatcher.unbind("event");
      dispatcher.emit("event");

      expect(onEvent).not.toHaveBeenCalled();
    });

    it("should remove listener if only event name + context is given", function() {
      var onEvent = jasmine.createSpy("onEvent");
      var context = {};

      dispatcher.bind("event", onEvent, context);
      dispatcher.unbind("event", null, context);
      dispatcher.emit("event");

      expect(onEvent).not.toHaveBeenCalled();
    });

    it("should remove listener if only callback is given", function() {
      var onEvent = jasmine.createSpy("onEvent");

      dispatcher.bind("event", onEvent);
      dispatcher.unbind(null , onEvent);
      dispatcher.emit("event");

      expect(onEvent).not.toHaveBeenCalled();
    });

    it("should remove listener if only callback + context is given", function() {
      var onEvent = jasmine.createSpy("onEvent");
      var context = {};

      dispatcher.bind("event", onEvent, context);
      dispatcher.unbind(null , onEvent, context);
      dispatcher.emit("event");

      expect(onEvent).not.toHaveBeenCalled();
    });

    it("should not remove listener on context mismatch", function() {
      var onEvent = jasmine.createSpy("onEvent");
      var context = {};

      dispatcher.bind("event", onEvent, context);
      dispatcher.unbind("event", onEvent, {});
      dispatcher.emit("event");

      expect(onEvent.calls.length).toEqual(1);
    });

    it("should not remove listener on event name mismatch", function() {
      var onEvent = jasmine.createSpy("onEvent");
      var context = {};

      dispatcher.bind("event", onEvent, context);
      dispatcher.unbind("boop", onEvent, {});
      dispatcher.emit("event");

      expect(onEvent.calls.length).toEqual(1);
    });

    it("should not remove listener on callback mismatch", function() {
      var onEvent = jasmine.createSpy("onEvent");
      var otherCallback = jasmine.createSpy("otherCallback");

      dispatcher.bind("event", onEvent);
      dispatcher.unbind("event", otherCallback);
      dispatcher.emit("event");

      expect(onEvent.calls.length).toEqual(1);
    });

    it("should not remove listener on callback or context mismatch", function() {
      var onEvent = jasmine.createSpy("onEvent");
      var otherCallback = jasmine.createSpy("otherCallback");
      var context = {};

      dispatcher.bind("event", onEvent, context);
      dispatcher.unbind("event", otherCallback, context);
      dispatcher.unbind("event", onEvent, {});
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

    it("should remove listener in the midst of it firing", function() {
      var onEvent = jasmine.createSpy("onEvent").andCallFake(function(){
        dispatcher.unbind("event", onEvent);
      });

      dispatcher.bind("event", onEvent);
      dispatcher.emit("event");
      dispatcher.emit("event");
      dispatcher.emit("event");

      expect(onEvent.calls.length).toEqual(1);
    });

    it("should call listener with provided context", function() {
      var returnedContext, context = {};
      var onEvent = jasmine.createSpy("onEvent").andCallFake(function(){
        returnedContext = this;
      });

      dispatcher.bind("event", onEvent, context);
      dispatcher.emit("event");

      expect(returnedContext).toEqual(context);
    });
  });
});
