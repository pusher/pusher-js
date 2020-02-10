var Pusher = require('pusher_integration');

var Integration = require("integration");
var Timer = require("core/utils/timers").OneOffTimer;
var Collections = require('core/utils/collections');
var Runtime = require('runtime').default;
var TRANSPORTS = Runtime.Transports;

// this is a slightly horrible function that allows easy placement of arbitrary
// delays in jasmine async tests. e.g:
// waitsFor(sleep(3000), "thing to happen", 3500)
function sleep(time) {
  var fn = function() {
    var val = false;
    setTimeout(function(){
      val = true;
    }, time)
    return function() {
      return val;
    }
  }
  return fn();
}

function canRunTwoConnections(transport) {
  if (transport !== "sockjs") {
    return true;
  }
  return !/(MSIE [67])|(Version\/(4|5\.0).*Safari)/.test(navigator.userAgent);
}

function subscribe(pusher, channelName, callback) {
  var channel = pusher.subscribe(channelName);
  channel.bind("pusher:subscription_succeeded", function(param) {
    callback(channel, param);
  });
  return channel;
}

function build(testConfig) {
  var forceTLS = testConfig.forceTLS;
  var transport = testConfig.transport;

  if (!TRANSPORTS[transport].isSupported({ useTLS: forceTLS })) {
    return;
  }

  describe("with " + (transport ? transport + ", " : "") + "forceTLS=" + forceTLS, function() {
    var pusher1, pusher2;

    beforeEach(function() {
      Collections.objectApply(TRANSPORTS, function(t, name) {
        spyOn(t, "isSupported").andReturn(false);
      });
      TRANSPORTS[transport].isSupported.andReturn(true);
    });

    describe("setup", function() {
      it("should open connections", function() {
        pusher1 = new Pusher("7324d55a5eeb8f554761", {
          forceTLS: forceTLS,
        });
        if (canRunTwoConnections(transport)) {
          pusher2 = new Pusher("7324d55a5eeb8f554761", {
            forceTLS: forceTLS,
          });
          waitsFor(function() {
            return pusher2.connection.state === "connected";
          }, "second connection to be established", 20000);
        }
        waitsFor(function() {
          return pusher1.connection.state === "connected";
        }, "first connection to be established", 20000);
      });

    });

    describe("with a public channel", function() {
      buildPublicChannelTests(
        function() { return pusher1; }
      );
    });

    describe("with a private channel", function() {
      var channelName = Integration.getRandomName("private-integration");
      var channel1, channel2;

      buildSubscriptionStateTests(
        function() { return pusher1; },
        "private-"
      );

      if (canRunTwoConnections(transport)) {
        buildClientEventsTests(
          function() { return pusher1; },
          function() { return pusher2; },
          "private-"
        );
      }
    });

    describe("with a presence channel", function() {
      buildSubscriptionStateTests(
        function() { return pusher1; },
        "presence-"
      );

      if (canRunTwoConnections(transport)) {
        buildClientEventsTests(
          function() { return pusher1; },
          function() { return pusher2; },
          "presence-"
        );
        buildPresenceChannelTests(
          function() { return pusher1; },
          function() { return pusher2; }
        );
      }
    });

    describe("teardown", function() {
      if (canRunTwoConnections(transport)) {
        it("should disconnect second connection", function() {
          pusher2.disconnect();
        });
      }

      it("should disconnect first connection", function() {
        pusher1.disconnect();
      });
    });
  });
}
function buildPresenceChannelTests(getPusher1, getPusher2) {
  it("should get connection's member data", function() {
    var pusher = getPusher1();
    var channelName = Integration.getRandomName("presence-integration_me");

    var members = null;
    subscribe(pusher, channelName, function(channel, ms) {
      members = ms;
    });

    waitsFor(function() {
      return members !== null;
    }, "channel to subscribe", 10000);
    runs(function() {
      expect(members.me).toEqual({
        id: pusher.connection.socket_id,
        info: {
          name: "Integration " + pusher.connection.socket_id,
          email: "integration-" + pusher.connection.socket_id + "@example.com"
        }
      });
    });
  });

  it("should receive a member added event", function() {
    var pusher1 = getPusher1();
    var pusher2 = getPusher2();
    var channelName = Integration.getRandomName("presence-integration_member_added");

    var member = null;
    subscribe(pusher1, channelName, function(channel) {
      channel.bind("pusher:member_added", function(m) {
        member = m;
      });

      subscribe(pusher2, channelName, function() {});
    });

    waitsFor(function() {
      return member !== null;
    }, "the member added event", 10000);
    runs(function() {
      expect(member.id).toEqual(pusher2.connection.socket_id);
      expect(member).toEqual({
        id: pusher2.connection.socket_id,
        info: {
          name: "Integration " + pusher2.connection.socket_id,
          email: "integration-" + pusher2.connection.socket_id + "@example.com"
        }
      });

      pusher1.unsubscribe(channelName);
      pusher2.unsubscribe(channelName);
    });
  });

  it("should receive a member removed event", function() {
    var pusher1 = getPusher1();
    var pusher2 = getPusher2();
    var channelName = Integration.getRandomName("presence-integration_member_removed");

    var member = null;
    subscribe(pusher2, channelName, function(channel) {
      channel.bind("pusher:member_added", function(_) {
        channel.bind("pusher:member_removed", function(m) {
          member = m;
        });
        pusher1.unsubscribe(channelName);
      });

      subscribe(pusher1, channelName, function() {});
    });

    waitsFor(function() {
      return member !== null;
    }, "the member removed event", 10000);
    runs(function() {
      expect(member.id).toEqual(pusher1.connection.socket_id);
      expect(member).toEqual({
        id: pusher1.connection.socket_id,
        info: {
          name: "Integration " + pusher1.connection.socket_id,
          email: "integration-" + pusher1.connection.socket_id + "@example.com"
        }
      });

      pusher2.unsubscribe(channelName);
    });
  });

  it("should maintain correct members count", function() {
    var pusher1 = getPusher1();
    var pusher2 = getPusher2();
    var channelName = Integration.getRandomName("presence-integration_member_count");

    var channel1, channel2;

    var onSubscribed1 = jasmine.createSpy("onSubscribed1");
    var onSubscribed2 = jasmine.createSpy("onSubscribed2");
    var onMemberAdded = jasmine.createSpy("onMemberAdded");
    var onMemberRemoved = jasmine.createSpy("onMemberRemoved");

    runs(function() {
      channel1 = subscribe(pusher1, channelName, onSubscribed1);
      expect(channel1.members.count).toEqual(0);
    });
    waitsFor(function() {
      return onSubscribed1.calls.length > 0;
    }, "first connection to subscribe", 10000);
    runs(function() {
      expect(channel1.members.count).toEqual(1);
      channel1.bind("pusher:member_added", onMemberAdded);
      channel2 = subscribe(pusher2, channelName, onSubscribed2);
    });
    waitsFor(function() {
      return onSubscribed2.calls.length > 0;
    }, "second connection to subscribe", 10000);
    runs(function() {
      expect(channel2.members.count).toEqual(2);
    });
    waitsFor(function() {
      return onMemberAdded.calls.length > 0;
    }, "member added event", 10000);
    runs(function() {
      expect(channel1.members.count).toEqual(2);
      channel2.bind("pusher:member_removed", onMemberRemoved);
      pusher1.unsubscribe(channelName);
    });
    waitsFor(function() {
      return onMemberRemoved.calls.length > 0;
    }, "member removed event", 10000);
    runs(function() {
      expect(channel2.members.count).toEqual(1);
    });
  });

  it("should maintain correct members data", function() {
    var pusher1 = getPusher1();
    var pusher2 = getPusher2();
    var channelName = Integration.getRandomName("presence-integration_member_count");

    var channel1, channel2;

    var onSubscribed1 = jasmine.createSpy("onSubscribed1");
    var onSubscribed2 = jasmine.createSpy("onSubscribed2");
    var onMemberAdded = jasmine.createSpy("onMemberAdded");
    var onMemberRemoved = jasmine.createSpy("onMemberRemoved");

    var member1 = {
      id: pusher1.connection.socket_id,
      info: {
        name: "Integration " + pusher1.connection.socket_id,
        email: "integration-" + pusher1.connection.socket_id + "@example.com"
      }
    };
    var member2 = {
      id: pusher2.connection.socket_id,
      info: {
        name: "Integration " + pusher2.connection.socket_id,
        email: "integration-" + pusher2.connection.socket_id + "@example.com"
      }
    };

    runs(function() {
      channel1 = subscribe(pusher1, channelName, onSubscribed1);
    });
    waitsFor(function() {
      return onSubscribed1.calls.length > 0;
    }, "first connection to subscribe", 10000);
    runs(function() {
      expect(channel1.members.get(pusher1.connection.socket_id))
        .toEqual(member1);
      expect(channel1.members.get(pusher2.connection.socket_id))
        .toBe(null);

      expect(channel1.members.me).toEqual(member1);

      channel1.bind("pusher:member_added", onMemberAdded);
      channel2 = subscribe(pusher2, channelName, onSubscribed2);
    });
    waitsFor(function() {
      return onSubscribed2.calls.length > 0;
    }, "second connection to subscribe", 10000);
    runs(function() {
      expect(channel2.members.get(pusher1.connection.socket_id))
        .toEqual(member1);
      expect(channel2.members.get(pusher2.connection.socket_id))
        .toEqual(member2);

      expect(channel2.members.me).toEqual(member2);
    });
    waitsFor(function() {
      return onMemberAdded.calls.length > 0;
    }, "member added event", 10000);
    runs(function() {
      expect(channel1.members.get(pusher1.connection.socket_id))
        .toEqual(member1);
      expect(channel1.members.get(pusher2.connection.socket_id))
        .toEqual(member2);

      channel2.bind("pusher:member_removed", onMemberRemoved);
      pusher1.unsubscribe(channelName);
    });
    waitsFor(function() {
      return onMemberRemoved.calls.length > 0;
    }, "member removed event", 10000);
    runs(function() {
      expect(channel2.members.get(pusher1.connection.socket_id))
        .toBe(null);
      expect(channel2.members.get(pusher2.connection.socket_id))
        .toEqual(member2);
    });
  });
}
function buildClientEventsTests(getPusher1, getPusher2, prefix) {
  it("should receive a client event sent by another connection", function() {
    var pusher1 = getPusher1();
    var pusher2 = getPusher2();

    var channelName = Integration.getRandomName((prefix || "") + "integration_client_events");

    var channel1, channel2;
    var onSubscribed1 = jasmine.createSpy("onSubscribed1");
    var onSubscribed2 = jasmine.createSpy("onSubscribed2");

    var eventName = "client-test";
    var data = { foo: "bar" };
    var onEvent1 = jasmine.createSpy("onEvent1");
    var onEvent2 = jasmine.createSpy("onEvent2");

    runs(function() {
      channel1 = subscribe(pusher1, channelName, onSubscribed1);
      channel2 = subscribe(pusher2, channelName, onSubscribed2);
    });
    waitsFor(function() {
      return onSubscribed1.calls.length > 0 && onSubscribed2.calls.length > 0;
    }, "both connections to subscribe", 10000);
    runs(function() {
      channel1.bind(eventName, onEvent1);
      channel2.bind(eventName, onEvent2);
      pusher1.send_event(eventName, data, channelName);
    });
    waitsFor(function() {
      return onEvent2.calls.length;
    }, "second connection to receive a message", 10000);
    runs(function() {
      pusher1.unsubscribe(channelName);
      pusher2.unsubscribe(channelName);
    });
  });

  it("should not receive a client event sent by itself", function() {
    var pusher = getPusher1();

    var channelName = Integration.getRandomName((prefix || "") + "integration_client_events");
    var onSubscribed = jasmine.createSpy("onSubscribed");

    var eventName = "client-test";
    var onEvent = jasmine.createSpy("onEvent");
    var timer = null;

    var channel = subscribe(pusher, channelName, onSubscribed);
    waitsFor(function() {
      return onSubscribed.calls.length > 0;
    }, "connection to subscribe", 10000);
    runs(function() {
      channel.bind(eventName, onEvent);
      pusher.send_event(eventName, {}, channelName);
      timer = new Timer(3000, function() {});
    });
    waitsFor(function() {
      return !timer.isRunning();
    }, "timer to finish", 3210);
    runs(function() {
      expect(onEvent).not.toHaveBeenCalled();
      pusher.unsubscribe(channelName);
    });
  });
}
function buildPublicChannelTests(getPusher, prefix) {
  it("should subscribe and receive a message sent via REST API", function() {
    var pusher = getPusher();
    var channelName = Integration.getRandomName((prefix || "") + "integration");

    var onSubscribed = jasmine.createSpy("onSubscribed");
    var channel = subscribe(pusher, channelName, onSubscribed);

    var eventName = "integration_event";
    var data = { x: 1, y: "z" };
    var received = null;

    waitsFor(function() {
      return onSubscribed.calls.length;
    }, "subscription to succeed", 10000);
    runs(function() {
      channel.bind(eventName, function(message) {
        received = message;
      });
      Integration.sendAPIMessage({
        url: Integration.API_URL + "/v2/send",
        channel: channelName,
        event: eventName,
        data: data
      });
    });
    waitsFor(function() {
      return received !== null;
    }, "message to get delivered", 10000);
    runs(function() {
      expect(received).toEqual(data);
      pusher.unsubscribe(channelName);
    });
  });

  it("should not receive messages after unsubscribing", function() {
    var pusher = getPusher();
    var channelName = Integration.getRandomName((prefix || "") + "integration");

    var onSubscribed = jasmine.createSpy("onSubscribed");
    var channel = subscribe(pusher, channelName, onSubscribed);

    var eventName = "after_unsubscribing";
    var received = null;
    var timer = null;

    waitsFor(function() {
      return onSubscribed.calls.length;
    }, "subscription to succeed", 10000);
    runs(function() {
      channel.bind(eventName, function(message) {
        received = message;
      });
      pusher.unsubscribe(channelName);
      Integration.sendAPIMessage({
        url: Integration.API_URL + "/v2/send",
        channel: channelName,
        event: eventName,
        data: {}
      });
      timer = new Timer(3000, function() {});
    });
    waitsFor(function() {
      return !timer.isRunning();
    }, "timer to finish", 3210);
    runs(function() {
      expect(received).toBe(null);
    });
  });

  it("should handle unsubscribing as an idempotent operation", function() {
    var pusher = getPusher();
    var channelName = Integration.getRandomName((prefix || "") + "integration");

    var onSubscribed = jasmine.createSpy("onSubscribed");
    subscribe(pusher, channelName, onSubscribed);

    waitsFor(function() {
      return onSubscribed.calls.length;
    }, "subscription to succeed", 10000);
    runs(function() {
      pusher.unsubscribe(channelName);
      pusher.unsubscribe(channelName);
      pusher.unsubscribe(channelName);
    });
  });

  it("should handle cancelling pending subscription", function() {
    var pusher = getPusher();
    var channelName = Integration.getRandomName((prefix || "") + "integration");

    var eventName = "after_unsubscribing";
    var received = null;
    var timer = null;

    var channel = pusher.subscribe(channelName);
    channel.bind(eventName, function(message) {
      received = message;
    });

    pusher.unsubscribe(channelName);
    waitsFor(function() {
      return !channel.subscriptionPending;
    }, "subscription to succeed", 10000);
    runs(function () {
      Integration.sendAPIMessage({
        url: Integration.API_URL + "/v2/send",
        channel: channelName,
        event: eventName,
        data: {}
      });
      timer = new Timer(3000, function() {});
    });
    waitsFor(function() {
      return !timer.isRunning();
    }, "timer to finish", 10000);
    runs(function() {
      expect(channel.subscribed).toEqual(false);
      expect(received).toBe(null);
    });
  });

  it("should handle reinstating cancelled pending subscription", function() {
    var pusher = getPusher();
    var channelName = Integration.getRandomName((prefix || "") + "integration");

    var eventName = "after_subscribing";
    var received = null;
    var timer = null;

    var channel = pusher.subscribe(channelName);
    channel.bind(eventName, function(message) {
      received = message;
    });

    pusher.unsubscribe(channelName);
    pusher.subscribe(channelName);
    waitsFor(function() {
      return !channel.subscriptionPending;
    }, "subscription to succeed", 10000);
    runs(function () {
      Integration.sendAPIMessage({
        url: Integration.API_URL + "/v2/send",
        channel: channelName,
        event: eventName,
        data: {}
      });
      timer = new Timer(3000, function() {});
    });
    waitsFor(function() {
      return !timer.isRunning();
    }, "timer to finish", 10000);
    runs(function() {
      expect(channel.subscribed).toEqual(true);
      expect(received).not.toBe(null);
    });
  });
}

function buildSubscriptionStateTests(getPusher, prefix) {
  it("sub-sub = sub", function() {
    var pusher = getPusher();
    var channelName = Integration.getRandomName((prefix || "") + "integration");

    pusher.subscribe(channelName)
    expect(pusher.channel(channelName).subscribed).toEqual(false);
    expect(pusher.channel(channelName).subscriptionPending).toEqual(true);
    expect(pusher.channel(channelName).subscriptionCancelled).toEqual(false);
    pusher.subscribe(channelName)
    expect(pusher.channel(channelName).subscribed).toEqual(false);
    expect(pusher.channel(channelName).subscriptionPending).toEqual(true);
    expect(pusher.channel(channelName).subscriptionCancelled).toEqual(false);

    waitsFor(function() {
      return pusher.channel(channelName).subscribed;
    }, "subscription to finish", 10000);

    runs(function() {
      expect(pusher.channel(channelName).subscribed).toEqual(true);
      expect(pusher.channel(channelName).subscriptionPending).toEqual(false);
      expect(pusher.channel(channelName).subscriptionCancelled).toEqual(false);
    });
  });

  it("sub-wait-sub = sub", function() {
    var pusher = getPusher();
    var channelName = Integration.getRandomName((prefix || "") + "integration");

    pusher.subscribe(channelName)
    expect(pusher.channel(channelName).subscribed).toEqual(false);
    expect(pusher.channel(channelName).subscriptionPending).toEqual(true);
    expect(pusher.channel(channelName).subscriptionCancelled).toEqual(false);

    waitsFor(function() {
      return pusher.channel(channelName).subscribed;
    }, "subscription to finish", 10000);

    runs(function() {
      expect(pusher.channel(channelName).subscribed).toEqual(true);
      expect(pusher.channel(channelName).subscriptionPending).toEqual(false);
      expect(pusher.channel(channelName).subscriptionCancelled).toEqual(false);

      pusher.subscribe(channelName)
      expect(pusher.channel(channelName).subscribed).toEqual(true);
      expect(pusher.channel(channelName).subscriptionPending).toEqual(false);
      expect(pusher.channel(channelName).subscriptionCancelled).toEqual(false);
    });
  });

  it("sub-unsub = NOP", function() {
    var pusher = getPusher();
    var channelName = Integration.getRandomName((prefix || "") + "integration");

    pusher.subscribe(channelName)
    expect(pusher.channel(channelName).subscribed).toEqual(false);
    expect(pusher.channel(channelName).subscriptionPending).toEqual(true);
    expect(pusher.channel(channelName).subscriptionCancelled).toEqual(false);

    pusher.unsubscribe(channelName)
    expect(pusher.channel(channelName).subscribed).toEqual(false);
    expect(pusher.channel(channelName).subscriptionPending).toEqual(true);
    expect(pusher.channel(channelName).subscriptionCancelled).toEqual(true);

    // there is no easy way to know when an unsubscribe request has been
    // actioned by the server, so we just wait a while
    waitsFor(sleep(3000), "unsubscription to finish", 3500)

    runs(function() {
      expect(pusher.channel(channelName)).toBe(undefined);
    });
  });

  it("sub-wait-unsub = NOP", function() {
    var pusher = getPusher();
    var channelName = Integration.getRandomName((prefix || "") + "integration");

    pusher.subscribe(channelName)
    expect(pusher.channel(channelName).subscribed).toEqual(false);
    expect(pusher.channel(channelName).subscriptionPending).toEqual(true);
    expect(pusher.channel(channelName).subscriptionCancelled).toEqual(false);

    waitsFor(function() {
      return pusher.channel(channelName).subscribed;
    }, "subscription to finish", 10000);

    runs(function() {
      expect(pusher.channel(channelName).subscribed).toEqual(true);
      expect(pusher.channel(channelName).subscriptionPending).toEqual(false);
      expect(pusher.channel(channelName).subscriptionCancelled).toEqual(false);

      pusher.unsubscribe(channelName)
      expect(pusher.channel(channelName)).toBe(undefined);
    });
  });

  it("sub-unsub-sub = sub", function() {
    var pusher = getPusher();
    var channelName = Integration.getRandomName((prefix || "") + "integration");

    pusher.subscribe(channelName)
    expect(pusher.channel(channelName).subscribed).toEqual(false);
    expect(pusher.channel(channelName).subscriptionPending).toEqual(true);
    expect(pusher.channel(channelName).subscriptionCancelled).toEqual(false);

    pusher.unsubscribe(channelName)
    expect(pusher.channel(channelName).subscribed).toEqual(false);
    expect(pusher.channel(channelName).subscriptionPending).toEqual(true);
    expect(pusher.channel(channelName).subscriptionCancelled).toEqual(true);

    pusher.subscribe(channelName)
    expect(pusher.channel(channelName).subscribed).toEqual(false);
    expect(pusher.channel(channelName).subscriptionPending).toEqual(true);
    expect(pusher.channel(channelName).subscriptionCancelled).toEqual(false);

    waitsFor(function() {
      return pusher.channel(channelName).subscribed;
    }, "subscription to finish", 10000);

    runs(function() {
      expect(pusher.channel(channelName).subscribed).toEqual(true);
      expect(pusher.channel(channelName).subscriptionPending).toEqual(false);
      expect(pusher.channel(channelName).subscriptionCancelled).toEqual(false);
    });
  });

  it("sub-unsub-wait-sub = sub", function() {
    var pusher = getPusher();
    var channelName = Integration.getRandomName((prefix || "") + "integration");

    pusher.subscribe(channelName)
    expect(pusher.channel(channelName).subscribed).toEqual(false);
    expect(pusher.channel(channelName).subscriptionPending).toEqual(true);
    expect(pusher.channel(channelName).subscriptionCancelled).toEqual(false);

    pusher.unsubscribe(channelName)
    expect(pusher.channel(channelName).subscribed).toEqual(false);
    expect(pusher.channel(channelName).subscriptionPending).toEqual(true);
    expect(pusher.channel(channelName).subscriptionCancelled).toEqual(true);

    // there is no easy way to know when an unsubscribe request has been
    // actioned by the server, so we just wait a while
    waitsFor(sleep(3000), "unsubscription to finish", 3500)
    runs(function() {
      expect(pusher.channel(channelName)).toBe(undefined);

      pusher.subscribe(channelName)
      expect(pusher.channel(channelName).subscribed).toEqual(false);
      expect(pusher.channel(channelName).subscriptionPending).toEqual(true);
      expect(pusher.channel(channelName).subscriptionCancelled).toEqual(false);
    });

    waitsFor(function() {
      return pusher.channel(channelName).subscribed;
    }, "subscription to finish", 10000);

    runs(function() {
      expect(pusher.channel(channelName).subscribed).toEqual(true);
      expect(pusher.channel(channelName).subscriptionPending).toEqual(false);
      expect(pusher.channel(channelName).subscriptionCancelled).toEqual(false);
    });
  });

  it("sub-unsub-unsub = NOP", function() {
    var pusher = getPusher();
    var channelName = Integration.getRandomName((prefix || "") + "integration");

    pusher.subscribe(channelName)
    expect(pusher.channel(channelName).subscribed).toEqual(false);
    expect(pusher.channel(channelName).subscriptionPending).toEqual(true);
    expect(pusher.channel(channelName).subscriptionCancelled).toEqual(false);

    pusher.unsubscribe(channelName)
    expect(pusher.channel(channelName).subscribed).toEqual(false);
    expect(pusher.channel(channelName).subscriptionPending).toEqual(true);
    expect(pusher.channel(channelName).subscriptionCancelled).toEqual(true);

    pusher.unsubscribe(channelName)
    expect(pusher.channel(channelName).subscribed).toEqual(false);
    expect(pusher.channel(channelName).subscriptionPending).toEqual(true);
    expect(pusher.channel(channelName).subscriptionCancelled).toEqual(true);

    // there is no easy way to know when an unsubscribe request has been
    // actioned by the server, so we just wait a while
    waitsFor(sleep(3000), "unsubscription to finish", 3500)

    runs(function() {
      expect(pusher.channel(channelName)).toBe(undefined);
    });
  });
}
module.exports = {build}
