var Integration = require("../helpers/integration");

var transports = require("transports/transports");
var util = require("util");

var Pusher = require("pusher");

Integration.describe("Cluster Configuration", function() {
  var TRANSPORTS = {
    "ws": transports.WSTransport,
    "xhr_streaming": transports.XHRStreamingTransport,
    "xhr_polling": transports.XHRPollingTransport,
    "xdr_streaming": transports.XDRStreamingTransport,
    "xdr_polling": transports.XDRPollingTransport
  };

  function subscribe(pusher, channelName, callback) {
    var channel = pusher.subscribe(channelName);
    channel.bind("pusher:subscription_succeeded", function(param) {
      callback(channel, param);
    });
    return channel;
  }

  var pusher;

  function describeClusterTest(options) {
    describe("with " + options.transport + ", encrypted=" + options.encrypted, function() {
      it("should open a connection to the 'eu' cluster", function() {
        pusher = new Pusher("4d31fbea7080e3b4bf6d", {
          enabledTransports: [options.transport],
          authEndpoint: Integration.API_EU_URL + "/auth",
          cluster: "eu",
          encrypted: options.encrypted,
          disableStats: true
        });
        waitsFor(function() {
          return pusher.connection.state === "connected";
        }, "connection to be established", 20000);
      });

      it("should subscribe and receive a message sent via REST API", function() {
        var channelName = Integration.getRandomName("private-integration");

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
            url: Integration.API_EU_URL + "/v2/send",
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

      it("should disconnect the connection", function() {
        pusher.disconnect();
      });
    });
  }

  if (!/version\/5.*safari/i.test(navigator.userAgent)) {
    // Safari 5 uses hixie-75/76, which is not supported on EU
    describeClusterTest({ transport: "ws", encrypted: false});
    describeClusterTest({ transport: "ws", encrypted: true});
  }

  if (util.isXHRSupported()) {
    // CORS-compatible browsers
    if (!/Android 2\./i.test(navigator.userAgent)) {
      // Android 2.x does a lot of buffering, which kills streaming
      describeClusterTest({ transport: "xhr_streaming", encrypted: false});
      describeClusterTest({ transport: "xhr_streaming", encrypted: true});
    }
    describeClusterTest({ transport: "xhr_polling", encrypted: false});
    describeClusterTest({ transport: "xhr_polling", encrypted: true});
  } else if (util.isXDRSupported(false)) {
    describeClusterTest({ transport: "xdr_streaming", encrypted: false});
    describeClusterTest({ transport: "xdr_streaming", encrypted: true});
    describeClusterTest({ transport: "xdr_polling", encrypted: false});
    describeClusterTest({ transport: "xdr_polling", encrypted: true});
  } else {
    throw new Error("this environment is not supported");
  }
});
