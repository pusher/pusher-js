var Errors = require('core/errors');
var PrivateChannel = require('core/channels/private_channel').default;
var Mocks = require("mocks");

describe("PrivateChannel", function() {
  var pusher;
  var channel;
  var channelAuthorizer;

  beforeEach(function() {
    channelAuthorizer = jasmine.createSpy("channelAuthorizer")
    pusher = Mocks.getPusher({ channelAuthorizer: channelAuthorizer });
    channel = new PrivateChannel("private-test", pusher);
  });

  describe("after construction", function() {
    it("#subscribed should be false", function() {
      expect(channel.subscribed).toEqual(false);
    });

    it("#subscriptionPending should be false", function() {
      expect(channel.subscriptionPending).toEqual(false);
    });

    it("#subscriptionCancelled should be false", function() {
      expect(channel.subscriptionCancelled).toEqual(false);
    });
  });

  describe("#authorize", function() {
    it("should call channelAuthorizer", function() {
      const callback = function(){}
      channel.authorize("1.23", callback);
      expect(channelAuthorizer.calls.count()).toEqual(1);
      expect(channelAuthorizer).toHaveBeenCalledWith(
        { socketId: "1.23", channelName: "private-test" }, callback);
    });
  });

  describe("#trigger", function() {
    beforeEach(function() {
      channel.subscribed = true;
    });

    it("should raise an exception if the event name does not start with client-", function() {
      expect(() => channel.trigger('whatever', {})).toThrow(jasmine.any(Errors.BadEventName));
    });

    it("should call send_event on connection", function() {
      channel.trigger("client-test", { k: "v" });
      expect(pusher.send_event)
        .toHaveBeenCalledWith("client-test", { k: "v" }, "private-test");
    });

    it("should return true if connection sent the event", function() {
      pusher.send_event.and.returnValue(true);
      expect(channel.trigger("client-test", {})).toBe(true);
    });

    it("should return false if connection didn't send the event", function() {
      pusher.send_event.and.returnValue(false);
      expect(channel.trigger("client-test", {})).toBe(false);
    });
  });

  describe("#disconnect", function() {
    it("should set subscribed to false", function() {
      channel.handleEvent({
        event: "pusher_internal:subscription_succeeded"
      });
      channel.disconnect();
      expect(channel.subscribed).toEqual(false);
    });
  });

  describe("#handleEvent", function() {
    it("should not emit pusher_internal:* events", function() {
      var callback = jasmine.createSpy("callback");
      channel.bind("pusher_internal:test", callback);
      channel.bind_global(callback);

      channel.handleEvent({
        event: "pusher_internal:test"
      });

      expect(callback).not.toHaveBeenCalled();
    });

    describe("on pusher_internal:subscription_succeeded", function() {
      it("should emit pusher:subscription_succeeded", function() {
        var callback = jasmine.createSpy("callback");
        channel.bind("pusher:subscription_succeeded", callback);

        channel.handleEvent({
          event: "pusher_internal:subscription_succeeded",
          data: "123"
        });

        expect(callback).toHaveBeenCalledWith("123");
      });

      it("should set #subscribed to true", function() {
        channel.handleEvent({
          event: "pusher_internal:subscription_succeeded",
          data: "123"
        });

        expect(channel.subscribed).toEqual(true);
      });

      it("should set #subscriptionPending to false", function() {
        channel.handleEvent({
          event: "pusher_internal:subscription_succeeded",
          data: "123"
        });

        expect(channel.subscriptionPending).toEqual(false);
      });
    });

    describe("pusher_internal:subscription_succeeded but subscription cancelled", function() {
      it("should not emit pusher:subscription_succeeded", function() {
        var callback = jasmine.createSpy("callback");
        channel.bind("pusher:subscription_succeeded", callback);

        channel.cancelSubscription();
        channel.handleEvent({
          event: "pusher_internal:subscription_succeeded",
          data: "123"
        });

        expect(callback).not.toHaveBeenCalled();
      });

      it("should set #subscribed to true", function() {
        channel.cancelSubscription();
        channel.handleEvent({
          event: "pusher_internal:subscription_succeeded",
          data: "123"
        });

        expect(channel.subscribed).toEqual(true);
      });

      it("should set #subscriptionPending to false", function() {
        channel.cancelSubscription();
        channel.handleEvent({
          event: "pusher_internal:subscription_succeeded",
          data: "123"
        });

        expect(channel.subscriptionPending).toEqual(false);
      });

      it("should call #pusher.unsubscribe", function() {
        expect(pusher.unsubscribe).not.toHaveBeenCalled();

        channel.cancelSubscription();
        channel.handleEvent({
          event: "pusher_internal:subscription_succeeded",
          data: "123"
        });

        expect(pusher.unsubscribe).toHaveBeenCalledWith(channel.name);
      });
    });

    describe("on other events", function() {
      it("should emit the event", function() {
        var callback = jasmine.createSpy("callback");
        channel.bind("something", callback);

        channel.handleEvent({
          event: "something",
          data: 9
        });

        expect(callback).toHaveBeenCalledWith(9, {});
      });
    });
  });
});
