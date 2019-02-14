var PresenceChannel = require('core/channels/presence_channel').default;
var Channel = require('core/channels/channel').default;
var Members = require('core/channels/members').default;
var Authorizer = require('core/auth/pusher_authorizer').default;
var Errors = require('core/errors');
var Factory = require('core/utils/factory').default;
var Mocks = require("mocks");

describe("PresenceChannel", function() {
  var pusher;
  var channel;

  beforeEach(function() {
    pusher = Mocks.getPusher({ foo: "bar" });
    channel = new PresenceChannel("presence-test", pusher);
  });

  describe("after construction", function() {
    it("#subscribed should be false", function() {
      expect(channel.subscribed).toBe(false);
    });

    it("#subscriptionPending should be false", function() {
      expect(channel.subscriptionPending).toEqual(false);
    });

    it("#subscriptionCancelled should be false", function() {
      expect(channel.subscriptionCancelled).toEqual(false);
    });

    it("#me should be undefined", function() {
      expect(channel.me).toBe(undefined);
    });

    it("#members should be created", function() {
      expect(channel.members).toEqual(jasmine.any(Members));
    });

    it("#members should be empty", function() {
      expect(channel.members.count).toEqual(0);

      var callback = jasmine.createSpy("callback");
      channel.members.each(callback);
      expect(callback).not.toHaveBeenCalled();
    });
  });

  describe("#authorize", function() {
    var authorizer;

    beforeEach(function() {
      authorizer = Mocks.getAuthorizer();
      spyOn(Factory, "createAuthorizer").andReturn(authorizer);
    });

    it("should create and call an authorizer", function() {
      channel.authorize("1.23", function() {});
      expect(Factory.createAuthorizer.calls.length).toEqual(1);
      expect(Factory.createAuthorizer).toHaveBeenCalledWith(
        channel,
        { foo: "bar" }
      );
    });

    it("should call back on success with authorization data", function() {
      var callback = jasmine.createSpy("callback");
      channel.authorize("1.23", callback);

      expect(callback).not.toHaveBeenCalled();
      authorizer._callback(false, {
        foo: "bar",
        channel_data: JSON.stringify({ user_id: "U" })
      });

      expect(callback).toHaveBeenCalledWith(false, {
        foo: "bar",
        channel_data: JSON.stringify({ user_id: "U" })
      });
    });

    it("should call back on failure", function() {
      var callback = jasmine.createSpy("callback");
      channel.authorize("1.23", callback);

      authorizer._callback("error!");

      expect(callback).toHaveBeenCalledWith("error!", undefined);
    });
  });

  describe("#trigger", function() {
    beforeEach(function() {
      channel.subscribed = true;
    });
    it("should raise an exception if the event name does not start with client-", function() {
      expect(function() {
        channel.trigger("whatever", {});
      }).toThrow(jasmine.any(Errors.BadEventName));
    });

    it("should call send_event on connection", function() {
      channel.trigger("client-test", { k: "v" });
      expect(pusher.send_event)
        .toHaveBeenCalledWith("client-test", { k: "v" }, "presence-test");
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

  describe("after authorizing", function() {
    var authorizer;

    beforeEach(function() {
      authorizer = Mocks.getAuthorizer();
      spyOn(Factory, "createAuthorizer").andReturn(authorizer);
      channel.authorize("1.23", function() {});
      authorizer._callback(false, {
        foo: "bar",
        channel_data: JSON.stringify({ user_id: "U" })
      });
    });

    describe("#handleEvent", function() {
      it("should not emit pusher_internal:* events", function() {
        var callback = jasmine.createSpy("callback");
        channel.bind("pusher_internal:test", callback);
        channel.bind_global(callback);

        channel.handleEvent({event: "pusher_internal:test"});

        expect(callback).not.toHaveBeenCalled();
      });

      describe("on pusher_internal:subscription_succeeded", function() {
        it("should emit pusher:subscription_succeeded with members", function() {
          var callback = jasmine.createSpy("callback");
          channel.bind("pusher:subscription_succeeded", callback);

          channel.handleEvent({
            event: "pusher_internal:subscription_succeeded",
            data: {
              presence: {
                hash: { "U": "me" },
                count: 1
              }
            }
          });

          expect(callback).toHaveBeenCalledWith(jasmine.any(Members));
        });

        it("should set #subscribed to true", function() {
          channel.handleEvent({
            event: "pusher_internal:subscription_succeeded",
            data: {
              presence: {
                hash: { "U": "me" },
                count: 1
              }
            }
          });

          expect(channel.subscribed).toEqual(true);
        });

        it("should set #subscriptionPending to false", function() {
          channel.handleEvent({
            event: "pusher_internal:subscription_succeeded",
            data: {
              presence: {
                hash: { "U": "me" },
                count: 1
              }
            }
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
        it("should emit metadata with user_id", function() {
          var callback = jasmine.createSpy("callback");
          channel.bind("client-something", callback);

          channel.handleEvent({
            event: "client-something",
            data: 9,
            user_id: "abc-def"
          });
          expect(callback).toHaveBeenCalledWith(9, {user_id: "abc-def"});
        });
      });
    });

    describe("after subscribing", function() {
      var members;

      beforeEach(function() {
        var callback = jasmine.createSpy("callback");
        channel.bind("pusher:subscription_succeeded", callback);
        channel.handleEvent({
          event: "pusher_internal:subscription_succeeded",
          data: {
            presence: {
              hash: {
                "A": "user A",
                "B": "user B",
                "U": "me"
              },
              count: 3
            }
          }
        });
        members = callback.calls[0].args[0];
      });

      it("members should store correct data", function() {
        expect(members.get("A")).toEqual({ id: "A", info: "user A" });
        expect(members.get("B")).toEqual({ id: "B", info: "user B" });
        expect(members.get("U")).toEqual({ id: "U", info: "me" });

        var callback = jasmine.createSpy("callback");
        members.each(callback);

        expect(callback.calls.length).toEqual(3);
        expect(callback).toHaveBeenCalledWith({ id: "A", info: "user A" });
        expect(callback).toHaveBeenCalledWith({ id: "B", info: "user B" });
        expect(callback).toHaveBeenCalledWith({ id: "U", info: "me" });
      });

      it("members should have correct count", function() {
        expect(members.count).toEqual(3);
      });

      it("#me should contain correct data", function() {
        expect(members.me).toEqual({ id: "U", info: "me" });
      });

      describe("on pusher_internal:member_added", function() {
        it("should add a new member", function() {
          channel.handleEvent({
            event: "pusher_internal:member_added",
            data: {
              user_id: "C",
              user_info: "user C"
            }
          });

          expect(members.get("C")).toEqual({ id: "C", info: "user C"});
        });

        it("should increment member count after adding a new member", function() {
          channel.handleEvent({
            event: "pusher_internal:member_added",
            data: {
              user_id: "C",
              user_info: "user C"
            }
          });

          expect(members.count).toEqual(4);
        });

        it("should emit pusher:member_added with new member's data", function() {
          var callback = jasmine.createSpy("callback");
          channel.bind("pusher:member_added", callback);

          channel.handleEvent({
            event: "pusher_internal:member_added",
            data: {
              user_id: "C",
              user_info: "user C"
            }
          });

          expect(callback).toHaveBeenCalledWith({ id: "C", info: "user C" });
        });

        it("should update an existing member", function() {
          channel.handleEvent({
            event: "pusher_internal:member_added",
            data: {
              user_id: "B",
              user_info: "updated B"
            }
          });

          expect(members.get("B")).toEqual({ id: "B", info: "updated B"});
        });

        it("should not increment member count after updating a member", function() {
          channel.handleEvent({
            event: "pusher_internal:member_added",
            data: {
              user_id: "B",
              user_info: "updated B"
            }
          });

          expect(members.count).toEqual(3);
        });

        it("should emit pusher:member_added with updated member's data", function() {
          var callback = jasmine.createSpy("callback");
          channel.bind("pusher:member_added", callback);

          channel.handleEvent({
            event: "pusher_internal:member_added",
            data: {
              user_id: "B",
              user_info: "updated B"
            }
          });

          expect(callback).toHaveBeenCalledWith({ id: "B", info: "updated B" });
        });
      });

      describe("on pusher_internal:member_removed", function() {
        it("should remove an existing member", function() {
          channel.handleEvent({
            event: "pusher_internal:member_removed",
            data: {
              user_id: "B"
            }
          });

          expect(members.get("B")).toEqual(null);
        });

        it("should emit pusher:member_removed with removed member's data", function() {
          var callback = jasmine.createSpy("callback");
          channel.bind("pusher:member_removed", callback);

          channel.handleEvent({
            event: "pusher_internal:member_removed",
            data: {
              user_id: "B"
            }
          });

          expect(callback).toHaveBeenCalledWith({ id: "B", info: "user B" });
        });

        it("should decrement member count after removing a member", function() {
          channel.handleEvent({
            event: "pusher_internal:member_removed",
            data: {
              user_id: "B"
            }
          });

          expect(members.count).toEqual(2);
        });

        it("should not emit pusher:member_removed if removed member didn't exist", function() {
          var callback = jasmine.createSpy("callback");
          channel.bind("pusher:member_removed", callback);

          channel.handleEvent({
            event: "pusher_internal:member_removed",
            data: {
              user_id: "C"
            },
          });

          expect(callback).not.toHaveBeenCalled();
        });

        it("should not decrement member count if member was not removed", function() {
          channel.handleEvent({
            event: "pusher_internal:member_removed",
            data: {
              user_id: "C"
            }
          });

          expect(members.count).toEqual(3);
        });
      });

      describe("and disconnecting", function() {
        beforeEach(function() {
          channel.disconnect();
        });

        it("#subscribed should be false", function() {
          expect(channel.subscribed).toBe(false);
        });

        it("#me should be undefined", function() {
          expect(channel.me).toBe(undefined);
        });

        it("#members should be the same object", function() {
          expect(channel.members).toBe(members);
        });

        it("#members should be empty", function() {
          expect(channel.members.count).toEqual(0);

          var callback = jasmine.createSpy("callback");
          channel.members.each(callback);
          expect(callback).not.toHaveBeenCalled();
        });
      });
    });
  });
});
