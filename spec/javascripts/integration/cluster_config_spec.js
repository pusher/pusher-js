describeIntegration("Cluster Configuration", function() {
  function subscribe(pusher, channelName, callback) {
    var channel = pusher.subscribe(channelName);
    channel.bind("pusher:subscription_succeeded", function(param) {
      callback(channel, param);
    });
    return channel;
  }

  var pusher;

  function describeClusterTest(options) {
    describe((options.ws ? "with" : "without") + " WebSockets/Flash, encrypted=" + options.encrypted, function() {
      var _VERSION, _channel_auth_transport, _channel_auth_endpoint;
      var _Dependencies;

      beforeEach(function() {
        if (options.ws) {
          spyOn(Pusher.SockJSTransport, "isSupported").andReturn(false);
        } else {
          spyOn(Pusher.WSTransport, "isSupported").andReturn(false);
          spyOn(Pusher.FlashTransport, "isSupported").andReturn(false);
        }
        spyOn(Pusher.Util, "getLocalStorage").andReturn({});
      });

      it("should prepare global config", function() {
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
          suffix: ""
        });
      });

      it("should open a connection to the 'eu' cluster", function() {
        pusher = new Pusher("4d31fbea7080e3b4bf6d", {
          authTransport: 'jsonp',
          authEndpoint: Pusher.Integration.API_EU_URL + "/auth",
          cluster: "eu",
          encrypted: options.encrypted
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
            url: Pusher.Integration.API_EU_URL + "/send",
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

      it("should restore global config", function() {
        Pusher.Dependencies = _Dependencies;
        Pusher.channel_auth_endpoint = _channel_auth_endpoint;
        Pusher.channel_auth_transport = _channel_auth_transport;
        Pusher.VERSION = _VERSION;
      });
    });
  }

  if (Pusher.WSTransport.isSupported() || Pusher.FlashTransport.isSupported()) {
    describeClusterTest({ ws: true, encrypted: false});
    describeClusterTest({ ws: true, encrypted: true});
  }
  describeClusterTest({ ws: false, encrypted: false});
  describeClusterTest({ ws: false, encrypted: true});
});
