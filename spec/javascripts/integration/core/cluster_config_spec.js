var TestEnv = require('testenv');
var Pusher = require('pusher_integration');

if (TestEnv === "web") {
  window.Pusher = Pusher;
  var Dependencies = require('dom/dependencies').Dependencies;
  var DependenciesReceivers = require('dom/dependencies').DependenciesReceivers;
  var DependencyLoader = require('dom/dependency_loader').default;
}

var Integration = require("integration");
var Collections = require("core/utils/collections");
var util = require("core/util").default;
var Runtime = require('runtime').default;
var Defaults = require('core/defaults').default;
var transports = Runtime.Transports;

Integration.describe("Cluster Configuration", function() {

  var TRANSPORTS = transports;

  function subscribe(pusher, channelName, callback) {
    var channel = pusher.subscribe(channelName);
    channel.bind("pusher:subscription_succeeded", function(param) {
      callback(channel, param);
    });
    return channel;
  }

  var pusher;

  function describeClusterTest(options) {
    var environment = { forceTLS: options.forceTLS };
    if (!TRANSPORTS[options.transport].isSupported(environment)) {
      return;
    }

    describe("with " + options.transport + ", forceTLS=" + options.forceTLS, function() {
      beforeEach(function() {
        Collections.objectApply(TRANSPORTS, function(transport, name) {
          spyOn(transport, "isSupported").andReturn(false);
        });
        TRANSPORTS[options.transport].isSupported.andReturn(true);
        spyOn(Runtime, "getLocalStorage").andReturn({});
      });

      it("should open a connection to the 'eu' cluster", function() {

        var authTransport = (TestEnv === "web") ? 'jsonp' : 'ajax';

        pusher = new Pusher("4d31fbea7080e3b4bf6d", {
          authTransport: authTransport,
          authEndpoint: Integration.API_EU_URL + "/auth",
          cluster: "eu",
          forceTLS: options.forceTLS,
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

  var _VERSION;
  var _channel_auth_transport;
  var _channel_auth_endpoint;
  var _Dependencies;

  it("should prepare the global config", function() {
    // TODO fix how versions work in unit tests
    _VERSION = Defaults.VERSION;
    _channel_auth_transport = Defaults.channel_auth_transport;
    _channel_auth_endpoint = Defaults.channel_auth_endpoint;
    _Dependencies = Dependencies;

    Defaults.VERSION = "8.8.8";
    Defaults.channel_auth_transport = "";
    Defaults.channel_auth_endpoint = "";

    if (TestEnv === "web") {
      Dependencies = new DependencyLoader({
        cdn_http: Integration.JS_HOST,
        cdn_https: Integration.JS_HOST,
        version: Defaults.VERSION,
        suffix: "",
        receivers: DependenciesReceivers
      });
    }
  });

  if (TestEnv !== "web" || !/version\/5.*safari/i.test(navigator.userAgent)) {
    // Safari 5 uses hixie-75/76, which is not supported on EU
    describeClusterTest({ transport: "ws", forceTLS: false});
    describeClusterTest({ transport: "ws", forceTLS: true});
  }

  if (Runtime.isXHRSupported()) {
    // CORS-compatible browsers
    if (TestEnv !== "web" || !/Android 2\./i.test(navigator.userAgent)) {
      // Android 2.x does a lot of buffering, which kills streaming
      describeClusterTest({ transport: "xhr_streaming", forceTLS: false});
      describeClusterTest({ transport: "xhr_streaming", forceTLS: true});
    }
    describeClusterTest({ transport: "xhr_polling", forceTLS: false});
    describeClusterTest({ transport: "xhr_polling", forceTLS: true});
  } else if (Runtime.isXDRSupported(false)) {
    describeClusterTest({ transport: "xdr_streaming", forceTLS: false});
    describeClusterTest({ transport: "xdr_streaming", forceTLS: true});
    describeClusterTest({ transport: "xdr_polling", forceTLS: false});
    describeClusterTest({ transport: "xdr_polling", forceTLS: true});
    // IE can fall back to SockJS if protocols don't match
    // No SockJS TLS tests due to the way JS files are served
    describeClusterTest({ transport: "sockjs", forceTLS: false});
  } else {
    // Browsers using SockJS
    describeClusterTest({ transport: "sockjs", forceTLS: false});
    describeClusterTest({ transport: "sockjs", forceTLS: true});
  }
});
