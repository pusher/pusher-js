describeIntegration("Cluster Configuration", function() {
  var TRANSPORTS = {
    "ws": Pusher.WSTransport,
    "flash": Pusher.FlashTransport,
    "sockjs": Pusher.SockJSTransport,
    "xhr_streaming": Pusher.XHRStreamingTransport,
    "xhr_polling": Pusher.XHRPollingTransport,
    "xdr_streaming": Pusher.XDRStreamingTransport,
    "xdr_polling": Pusher.XDRPollingTransport
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
    var environment = { encrypted: options.encrypted };
    if (!TRANSPORTS[options.transport].isSupported(environment)) {
      return;
    }

    describe("with " + options.transport + ", encrypted=" + options.encrypted, function() {
      beforeEach(function() {
        Pusher.Util.objectApply(TRANSPORTS, function(transport, name) {
          spyOn(transport, "isSupported").andReturn(false);
        });
        TRANSPORTS[options.transport].isSupported.andReturn(true);
        spyOn(Pusher.Util, "getLocalStorage").andReturn({});
      });

      it("should open a connection to the 'eu' cluster", function() {
        pusher = new Pusher("4d31fbea7080e3b4bf6d", {
          authTransport: 'jsonp',
          authEndpoint: Pusher.Integration.API_EU_URL + "/auth",
          cluster: "eu",
          encrypted: options.encrypted,
          disableStats: true
        });
        waitsFor(function() {
          return pusher.connection.state === "connected";
        }, "connection to be established", 20000);
      });

      it("should subscribe and receive a message sent via REST API", function() {
        var channelName = Pusher.Integration.getRandomName("private-integration");

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
          Pusher.Integration.sendAPIMessage({
            url: Pusher.Integration.API_EU_URL + "/v2/send",
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
    _VERSION = Pusher.VERSION;
    _channel_auth_transport = Pusher.channel_auth_transport;
    _channel_auth_endpoint = Pusher.channel_auth_endpoint;
    _Dependencies = Pusher.Dependencies;

    Pusher.VERSION = "8.8.8";
    Pusher.channel_auth_transport = "";
    Pusher.channel_auth_endpoint = "";
    Pusher.Dependencies = new Pusher.DependencyLoader({
      cdn_http: Pusher.Integration.JS_HOST,
      cdn_https: Pusher.Integration.JS_HOST,
      version: Pusher.VERSION,
      suffix: "",
      receivers: Pusher.DependenciesReceivers
    });
  });

  if (!/version\/5.*safari/i.test(navigator.userAgent)) {
    // Safari 5 uses hixie-75/76, which is not supported on EU
    describeClusterTest({ transport: "ws", encrypted: false});
    describeClusterTest({ transport: "ws", encrypted: true});
  }
  // describeClusterTest({ transport: "flash", encrypted: false});
  // there's a problem with Flash policy file on EU when encrypted
  // describeClusterTest({ transport: "flash", encrypted: true});

  if (Pusher.Util.isXHRSupported()) {
    // CORS-compatible browsers
    if (!/Android 2\./i.test(navigator.userAgent)) {
      // Android 2.x does a lot of buffering, which kills streaming
      describeClusterTest({ transport: "xhr_streaming", encrypted: false});
      describeClusterTest({ transport: "xhr_streaming", encrypted: true});
    }
    describeClusterTest({ transport: "xhr_polling", encrypted: false});
    describeClusterTest({ transport: "xhr_polling", encrypted: true});
  } else if (Pusher.Util.isXDRSupported(false)) {
    describeClusterTest({ transport: "xdr_streaming", encrypted: false});
    describeClusterTest({ transport: "xdr_streaming", encrypted: true});
    describeClusterTest({ transport: "xdr_polling", encrypted: false});
    describeClusterTest({ transport: "xdr_polling", encrypted: true});
    // IE can fall back to SockJS if protocols don't match
    // No SockJS encrypted tests due to the way JS files are served
    describeClusterTest({ transport: "sockjs", encrypted: false});
  } else {
    // Browsers using SockJS
    describeClusterTest({ transport: "sockjs", encrypted: false});
    describeClusterTest({ transport: "sockjs", encrypted: true});
  }

  it("should restore the global config", function() {
    Pusher.Dependencies = _Dependencies;
    Pusher.channel_auth_endpoint = _channel_auth_endpoint;
    Pusher.channel_auth_transport = _channel_auth_transport;
    Pusher.VERSION = _VERSION;
  });
});
