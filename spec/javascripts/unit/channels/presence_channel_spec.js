describe("PresenceChannel", function() {
  var pusher;
  var channel;

  beforeEach(function() {
    pusher = Pusher.Mocks.getPusher();
    channel = new Pusher.PresenceChannel("presence-test", pusher);
  });

  describe("after construction", function() {
    it("#subscribed should be false", function() {
      expect(channel.subscribed).toEqual(false);
    });
  });

  describe("#authorize", function() {
    var authorizer;

    beforeEach(function() {
      authorizer = Pusher.Mocks.getAuthorizer();
      spyOn(Pusher.Channel, "Authorizer").andReturn(authorizer);
    });

    it("should create and call an authorizer", function() {
      channel.authorize("1.23", { x: "y" }, function() {});
      expect(Pusher.Channel.Authorizer.calls.length).toEqual(1);
      expect(Pusher.Channel.Authorizer)
        .toHaveBeenCalledWith(
          channel,
          Pusher.channel_auth_transport,
          { x: "y" }
        );
    });

    it("should call back on success with authorization data", function() {
      var callback = jasmine.createSpy("callback");
      channel.authorize("1.23", { x: "y" }, callback);

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
      channel.authorize("1.23", { x: "y" }, callback);

      authorizer._callback("error!");

      expect(callback).toHaveBeenCalledWith("error!", undefined);
    });
  });

  describe("#trigger", function() {
    it("should call send_event on connection", function() {
      channel.trigger("test_event", { k: "v" });
      expect(pusher.send_event)
        .toHaveBeenCalledWith("test_event", { k: "v" }, "presence-test");
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
      channel.handleEvent("pusher_internal:subscription_succeeded", {
        presence: {
          hash: {},
          count: 0
        }
      });
      channel.disconnect();
      expect(channel.subscribed).toEqual(false);
    });
  });

  describe("after authorizing", function() {
    var authorizer;

    beforeEach(function() {
      authorizer = Pusher.Mocks.getAuthorizer();
      spyOn(Pusher.Channel, "Authorizer").andReturn(authorizer);
      channel.authorize("1.23", { x: "y" }, function() {});
      authorizer._callback(false, {
        foo: "bar",
        channel_data: JSON.stringify({ user_id: "U" })
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
          channel.handleEvent("pusher_internal:subscription_succeeded", {
            presence: {
              hash: {},
              count: 0
            }
          });
          expect(channel.subscribed).toEqual(true);
        });

        it("should emit pusher:subscription_succeded with members", function() {
          var callback = jasmine.createSpy("callback");
          channel.bind("pusher:subscription_succeeded", callback);

          channel.handleEvent("pusher_internal:subscription_succeeded", {
            presence: {
              hash: { "U": "me" },
              count: 1
            }
          });

          expect(callback).toHaveBeenCalledWith(jasmine.any(Pusher.Members));
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

    describe("after subscribing", function() {
      var members;

      beforeEach(function() {
        var callback = jasmine.createSpy("callback");
        channel.bind("pusher:subscription_succeeded", callback);
        channel.handleEvent("pusher_internal:subscription_succeeded", {
          presence: {
            hash: {
              "A": "user A",
              "B": "user B",
              "U": "me"
            },
            count: 3
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

      it("should expose 'my' data", function() {
        expect(members.me).toEqual({ id: "U", info: "me" });
      });

      describe("on pusher_internal:member_added", function() {
        it("should add a new member", function() {
          channel.handleEvent("pusher_internal:member_added", {
            user_id: "C",
            user_info: "user C"
          });

          expect(members.get("C")).toEqual({ id: "C", info: "user C"});
        });

        it("should increment member count", function() {
          channel.handleEvent("pusher_internal:member_added", {
            user_id: "C",
            user_info: "user C"
          });

          expect(members.count).toEqual(4);
        });

        it("should emit pusher:member_added with new member's data", function() {
          var callback = jasmine.createSpy("callback");
          channel.bind("pusher:member_added", callback);

          channel.handleEvent("pusher_internal:member_added", {
            user_id: "C",
            user_info: "user C"
          });

          expect(callback).toHaveBeenCalledWith({ id: "C", info: "user C" });
        });

        it("should update an existing member", function() {
          channel.handleEvent("pusher_internal:member_added", {
            user_id: "B",
            user_info: "updated B"
          });

          expect(members.get("B")).toEqual({ id: "B", info: "updated B"});
        });

        it("should not increment member count", function() {
          channel.handleEvent("pusher_internal:member_added", {
            user_id: "B",
            user_info: "updated B"
          });

          expect(members.count).toEqual(3);
        });

        it("should emit pusher:member_added with updated member's data", function() {
          var callback = jasmine.createSpy("callback");
          channel.bind("pusher:member_added", callback);

          channel.handleEvent("pusher_internal:member_added", {
            user_id: "B",
            user_info: "updated B"
          });

          expect(callback).toHaveBeenCalledWith({ id: "B", info: "updated B" });
        });
      });

      describe("on pusher_internal:member_removed", function() {
        it("should remove an existing member", function() {
          channel.handleEvent("pusher_internal:member_removed", {
            user_id: "B"
          });

          expect(members.get("B")).toEqual(null);
        });

        it("should emit pusher:member_removed with removed member's data", function() {
          var callback = jasmine.createSpy("callback");
          channel.bind("pusher:member_removed", callback);

          channel.handleEvent("pusher_internal:member_removed", {
            user_id: "B"
          });

          expect(callback).toHaveBeenCalledWith({ id: "B", info: "user B" });
        });

        it("should decrement member count", function() {
          channel.handleEvent("pusher_internal:member_removed", {
            user_id: "B"
          });

          expect(members.count).toEqual(2);
        })

        it("should not emit pusher:member_removed if removed member didn't exist", function() {
          var callback = jasmine.createSpy("callback");
          channel.bind("pusher:member_removed", callback);

          channel.handleEvent("pusher_internal:member_removed", {
            user_id: "C",
          });

          expect(callback).not.toHaveBeenCalled();
        });
      });
    });
  });
});
