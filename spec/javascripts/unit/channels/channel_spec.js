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
      channel.authorize("1.1", callback);
      expect(callback).toHaveBeenCalledWith(false, {});
    });
  });

  describe("#trigger", function() {
    it("should raise an exception if the event name does not start with client-", function() {
      expect(function() {
        channel.trigger("whatever", {});
      }).toThrow(jasmine.any(Pusher.Errors.BadEventName));
    });

    it("should call send_event on connection", function() {
      channel.trigger("client-test", { k: "v" });
      expect(pusher.send_event)
        .toHaveBeenCalledWith("client-test", { k: "v" }, "test");
    });

    it("should return true if connection sent the event", function() {
      pusher.send_event.andReturn(true);
      expect(channel.trigger("client-test", {})).toBe(true);
    });

    it("should return false if connection didn't send the event", function() {
      pusher.send_event.andReturn(false);
      expect(channel.trigger("client-test", {})).toBe(false);
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
      it("should emit pusher:subscription_succeded", function() {
        var callback = jasmine.createSpy("callback");
        channel.bind("pusher:subscription_succeeded", callback);

        channel.handleEvent("pusher_internal:subscription_succeeded", "123");

        expect(callback).toHaveBeenCalledWith("123");
      });

      it("should set #subscribed to true", function() {
        channel.bind(function() {
          expect(channel.subscribed).toEqual(true);
        });
        channel.handleEvent("pusher_internal:subscription_succeeded");
      });
    });

    describe("on other events", function() {
      it("should emit the event", function() {
        var callback = jasmine.createSpy("callback");
        channel.bind("something", callback);

        channel.handleEvent("something", 9);

        expect(callback).toHaveBeenCalledWith(9);
      });

      it("should emit the event even if it's named like JS built-in", function() {
        var callback = jasmine.createSpy("callback");
        channel.bind("toString", callback);

        channel.handleEvent("toString", "works");

        expect(callback).toHaveBeenCalledWith("works");
      });
    });
  });

  describe("#subscribe", function() {
    beforeEach(function() {
      pusher.connection = {
        socket_id: "9.37"
      };
      channel.authorize = jasmine.createSpy("authorize");
    });

    it("should authorize the connection first", function() {
      expect(channel.authorize.calls.length).toEqual(0);
      channel.subscribe();

      expect(channel.authorize.calls.length).toEqual(1);
      expect(channel.authorize).toHaveBeenCalledWith(
        "9.37", jasmine.any(Function)
      );
    });

    it("should send a pusher:subscribe message on successful authorization", function() {
      expect(pusher.send_event).not.toHaveBeenCalled();

      channel.subscribe();
      var authorizeCallback = channel.authorize.calls[0].args[1];
      authorizeCallback(false, {
        auth: "one",
        channel_data: "two"
      });

      expect(pusher.send_event).toHaveBeenCalledWith(
        "pusher:subscribe",
        { auth: "one", channel_data: "two", channel: "test" }
      );
    });

    it("should emit pusher:subscription_error event on unsuccessful authorization", function() {
      var onSubscriptionError = jasmine.createSpy("onSubscriptionError");
      channel.bind("pusher:subscription_error", onSubscriptionError);

      channel.subscribe();
      var authorizeCallback = channel.authorize.calls[0].args[1];
      authorizeCallback(true, { error: "test error" });

      expect(onSubscriptionError).toHaveBeenCalledWith(
        { error: "test error" }
      );
      expect(pusher.send_event).not.toHaveBeenCalled();
    });
  });

  describe("#unsubscribe", function() {
    it("should send a pusher:unsubscribe message", function() {
      expect(pusher.send_event).not.toHaveBeenCalled();
      channel.unsubscribe();

      expect(pusher.send_event).toHaveBeenCalledWith(
        "pusher:unsubscribe", { channel: "test" }
      );
    });
  });
});
