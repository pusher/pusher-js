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

    it("should remove the listener while emitting events (regression)", function() {
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

    it("should not remove the last callback if unbinding a function that was not bound (regression)", function() {
      var onEvent = jasmine.createSpy("onEvent");
      var otherCallback = jasmine.createSpy("otherCallback");

      dispatcher.bind("event", onEvent);
      dispatcher.unbind("event", otherCallback);

      dispatcher.emit("event");
      expect(onEvent.calls.length).toEqual(1);
    });

    it("should remove all listeners on omitted arguments", function() {
      var onEvent1 = jasmine.createSpy("onEvent1");
      var onEvent2 = jasmine.createSpy("onEvent2");

      dispatcher.bind("event1", onEvent1);
      dispatcher.bind("event2", onEvent2);
      dispatcher.unbind();
      dispatcher.emit("event1");
      dispatcher.emit("event2");

      expect(onEvent1).not.toHaveBeenCalled();
      expect(onEvent2).not.toHaveBeenCalled();
    });

    it("should remove all event's listeners if only event name is given", function() {
      var onEvent1 = jasmine.createSpy("onEvent1");
      var onEvent2 = jasmine.createSpy("onEvent2");
      var onOther = jasmine.createSpy("onOther");

      dispatcher.bind("event", onEvent1);
      dispatcher.bind("event", onEvent2, {});
      dispatcher.bind("other", onOther);
      dispatcher.unbind("event");

      dispatcher.emit("event");
      dispatcher.emit("other");

      expect(onEvent1).not.toHaveBeenCalled();
      expect(onEvent2).not.toHaveBeenCalled();
      expect(onOther.calls.length).toEqual(1);
    });

    it("should remove all listeners with given callback", function() {
      var onEvent = jasmine.createSpy("onEvent");
      var onOther = jasmine.createSpy("onOther");

      dispatcher.bind("event", onEvent);
      dispatcher.bind("event2", onEvent, {});
      dispatcher.bind("event2", onOther);
      dispatcher.unbind(null , onEvent);

      dispatcher.emit("event");
      dispatcher.emit("event2");

      expect(onEvent).not.toHaveBeenCalled();
      expect(onOther.calls.length).toEqual(1);
    });

    it("should remove all event's listeners with given callback", function() {
      var onEvent = jasmine.createSpy("onEvent");

      dispatcher.bind("event", onEvent);
      dispatcher.bind("event2", onEvent);
      dispatcher.unbind("event" , onEvent);

      dispatcher.emit("event");
      expect(onEvent).not.toHaveBeenCalled();
      dispatcher.emit("event2");
      expect(onEvent.calls.length).toEqual(1);
    });

    it("should remove all event's listeners with given context", function() {
      var onEvent1 = jasmine.createSpy("onEvent1");
      var onEvent2 = jasmine.createSpy("onEvent2");
      var onEvent3 = jasmine.createSpy("onEvent3");
      var context = {};

      dispatcher.bind("event", onEvent1, context);
      dispatcher.bind("event", onEvent2, context);
      dispatcher.bind("event", onEvent3);
      dispatcher.unbind("event", null, context);

      dispatcher.emit("event");

      expect(onEvent1).not.toHaveBeenCalled();
      expect(onEvent2).not.toHaveBeenCalled();
      expect(onEvent3.calls.length).toEqual(1);
    });

    it("should remove all listeners with given context", function() {
      var onEvent1 = jasmine.createSpy("onEvent1");
      var onEvent2 = jasmine.createSpy("onEvent2");
      var onEvent3 = jasmine.createSpy("onEvent3");
      var context = {};

      dispatcher.bind("event1", onEvent1, context);
      dispatcher.bind("event2", onEvent2, context);
      dispatcher.bind("event3", onEvent3);
      dispatcher.unbind(null, null, context);

      dispatcher.emit("event1");
      dispatcher.emit("event2");
      dispatcher.emit("event3");

      expect(onEvent1).not.toHaveBeenCalled();
      expect(onEvent2).not.toHaveBeenCalled();
      expect(onEvent3.calls.length).toEqual(1);
    });

    it("should remove all event's listeners with given callback and context", function() {
      var onEvent = jasmine.createSpy("onEvent");
      var context = {};

      dispatcher.bind("event", onEvent, context);
      dispatcher.bind("event2", onEvent, context);
      dispatcher.unbind("event" , onEvent, context);

      dispatcher.emit("event");
      expect(onEvent).not.toHaveBeenCalled();

      dispatcher.emit("event2");
      expect(onEvent.calls.length).toEqual(1);
    });

    it("should remove all listeners with given callback and context", function() {
      var onEvent = jasmine.createSpy("onEvent");
      var onOther = jasmine.createSpy("onOther");
      var context = {};

      dispatcher.bind("event", onEvent, context);
      dispatcher.bind("event2", onEvent, context);
      dispatcher.bind("event3", onEvent);
      dispatcher.bind("other", onOther, context);
      dispatcher.unbind(null , onEvent, context);

      dispatcher.emit("event");
      dispatcher.emit("event2");
      expect(onEvent).not.toHaveBeenCalled();

      dispatcher.emit("event3");
      expect(onEvent.calls.length).toEqual(1);

      dispatcher.emit("other");
      expect(onOther.calls.length).toEqual(1);
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

    it("should call listener with provided context", function() {
      var context = {};
      var boundContext, unboundContext;

      var onEventBound = jasmine.createSpy("onEventBound").andCallFake(function(){
        boundContext = this;
      });
      var onEventUnbound = jasmine.createSpy("onEventUnbound").andCallFake(function(){
        unboundContext = this;
      });

      dispatcher.bind("event", onEventBound, context);
      dispatcher.bind("event", onEventUnbound);
      dispatcher.emit("event");

      expect(boundContext).toEqual(context);
      expect(unboundContext).toEqual(window);
    });
  });
});
