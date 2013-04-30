describe("Channel", function() {
  var pusher;
  var channel;

  beforeEach(function() {
    pusher = Pusher.Mocks.getPusher();
    channel = new Pusher.Channel("test", pusher);
  });

  describe("after construction", function() {
    it("#subscribed should be false", function() {
      expect(channel.subscribed).toEqual(false);
    });
  });

  describe("#authorize", function() {
    it("should call back with false, {} immediately", function() {
      var callback = jasmine.createSpy("callback");
      channel.authorize("1.1", {}, callback);
      expect(callback).toHaveBeenCalledWith(false, {});
    });
  });

  describe("#trigger", function() {
    it("should call send_event on connection", function() {
      channel.trigger("test_event", { k: "v" });
      expect(pusher.send_event)
        .toHaveBeenCalledWith("test_event", { k: "v" }, "test");
    });

    it("should return true if connection sent the event", function() {
      pusher.send_event.andReturn(true);
      expect(channel.trigger("t", {})).toBe(true);
    });

    it("should return false if connection didn't send the event", function() {
      pusher.send_event.andReturn(false);
      expect(channel.trigger("t", {})).toBe(false);
    });
  });

  describe("#disconnect", function() {
    it("should set subscribed to false", function() {
      channel.handleEvent("pusher_internal:subscription_succeeded");
      channel.disconnect();
      expect(channel.subscribed).toEqual(false);
    });
  });

  describe("#handleEvent", function() {
    it("should not emit pusher_internal:* events", function() {
      var callback = jasmine.createSpy("callback");
      channel.bind("pusher_internal:test", callback);
      channel.bind_all(callback);

      channel.handleEvent("pusher_internal:test");

      expect(callback).not.toHaveBeenCalled();
    });

    describe("on pusher_internal:subscription_succeded", function() {
      it("should set #subscribed to true", function() {
        channel.handleEvent("pusher_internal:subscription_succeeded");
        expect(channel.subscribed).toEqual(true);
      });

      it("should emit pusher:subscription_succeded", function() {
        var callback = jasmine.createSpy("callback");
        channel.bind("pusher:subscription_succeeded", callback);

        channel.handleEvent("pusher_internal:subscription_succeeded", "123");

        expect(callback).toHaveBeenCalledWith("123");
      });
    });

    describe("on other events", function() {
      it("should emit the event", function() {
        var callback = jasmine.createSpy("callback");
        channel.bind("something", callback);

        channel.handleEvent("something", 9);

        expect(callback).toHaveBeenCalledWith(9);
      });
    });
  });
});
