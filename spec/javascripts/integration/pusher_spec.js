describe("Pusher (semi-integration)", function() {
  var pusher;

  beforeEach(function() {
    spyOn(Pusher.Network, "isOnline").andReturn(true);

    spyOn(Pusher.WSTransport, "isSupported").andReturn(true);
    spyOn(Pusher.FlashTransport, "isSupported").andReturn(false);
    spyOn(Pusher.SockJSTransport, "isSupported").andReturn(true);

    spyOn(Pusher.Util, "getLocalStorage").andReturn({});
  });

  afterEach(function() {
    pusher.disconnect();
  });

  it("should fall back to SockJS after two broken connections", function() {
    var transport;

    function createConnection() {
      transport = Pusher.Mocks.getTransport(true);
      return transport;
    }

    spyOn(Pusher.WSTransport, "createConnection").andCallFake(createConnection);
    spyOn(Pusher.SockJSTransport, "createConnection").andCallFake(createConnection);

    runs(function() {
      pusher = new Pusher("foobar");
      pusher.connect();
    });
    waitsFor(function() {
      return Pusher.WSTransport.createConnection.calls.length === 1;
    }, "WS connection to be created", 500);
    runs(function() {
      transport.state = "initialized";
      transport.emit("initialized");
    });
    waitsFor(function() {
      return transport.connect.calls.length === 1;
    }, "connect to be called", 500);
    runs(function() {
      transport.state = "open";
      transport.emit("open");

      new Pusher.Timer(100, function() {
        transport.emit("closed", {
          code: 1006,
          reason: "KABOOM!",
          wasClean: false
        });
      });
    });
    waitsFor(function() {
      return Pusher.WSTransport.createConnection.calls.length === 2;
    }, "WS connection to be created", 1500);
    runs(function() {
      transport.state = "initialized";
      transport.emit("initialized");
    });
    waitsFor(function() {
      return transport.connect.calls.length === 1;
    }, "connect to be called", 500);
    runs(function() {
      transport.state = "open";
      transport.emit("open");

      new Pusher.Timer(100, function() {
        transport.emit("closed", {
          code: 1006,
          reason: "KABOOM! AGAIN!",
          wasClean: false
        });
      });
    });
    waitsFor(function() {
      return Pusher.SockJSTransport.createConnection.calls.length === 1;
    }, "SockJS connection to be created", 1500);
    runs(function() {
      expect(Pusher.WSTransport.createConnection.calls.length).toEqual(2);
      pusher.disconnect();
    });
  });

  it("should not close established SockJS connection when WebSocket is stuck in handshake", function() {
    var wsTransport, sockjsTransport;

    function createWSConnection() {
      wsTransport = Pusher.Mocks.getTransport(true);
      return wsTransport;
    }
    function createSockJSConnection() {
      sockjsTransport = Pusher.Mocks.getTransport(true);
      return sockjsTransport;
    }

    spyOn(Pusher.WSTransport, "createConnection").andCallFake(createWSConnection);
    spyOn(Pusher.SockJSTransport, "createConnection").andCallFake(createSockJSConnection);

    runs(function() {
      pusher = new Pusher("foobar");
      pusher.connect();
    });
    waitsFor(function() {
      return Pusher.WSTransport.createConnection.calls.length === 1;
    }, "WS connection to be created", 500);
    runs(function() {
      wsTransport.state = "initialized";
      wsTransport.emit("initialized");
    });
    waitsFor(function() {
      return wsTransport.connect.calls.length === 1;
    }, "connect on WS to be called", 500);
    runs(function() {
      wsTransport.state = "open";
      wsTransport.emit("open");
      // start handshake, but don't do anything
    });
    waitsFor(function() {
      return Pusher.SockJSTransport.createConnection.calls.length === 1;
    }, "SockJS connection to be created", 3000);
    runs(function() {
      sockjsTransport.state = "initialized";
      sockjsTransport.emit("initialized");
    });
    waitsFor(function() {
      return sockjsTransport.connect.calls.length === 1;
    }, "connect on SockJS to be called", 500);
    runs(function() {
      sockjsTransport.state = "open";
      sockjsTransport.emit("open");
      sockjsTransport.emit("message", {
        data: JSON.stringify({
          event: "pusher:connection_established",
          data: {
            socket_id: "123.456"
          }
        })
      });
    });
    waitsFor(function() {
      return wsTransport.close.calls.length === 1;
    }, "close on WS to be called", 500);

    var timer;
    runs(function() {
      // this caused a connection to be retried after 1s
      wsTransport.emit("closed", {
        code: 1000,
        wasClean: true,
        reason: "clean"
      });
      timer = new Pusher.Timer(2000, function() {});
    });
    waitsFor(function() {
      return !timer.isRunning();
    }, "timer to be called", 2500);
    runs(function() {
      expect(sockjsTransport.close).not.toHaveBeenCalled();
    });
  });
});

describeIntegration("Pusher", function() {
  // Integration tests in Jasmine need to have setup and teardown phases as
  // separate specs to make sure we share connections between actual specs.
  // This way we can also make sure connections are closed even when tests fail.
  //
  // Ideally, we'd have a separate connection per spec, but this introduces
  // significant delays and triggers security mechanisms in some browsers.

  function generatePseudoRandomName(prefix) {
    return prefix + "_" + Pusher.Util.now() + "_" + Math.floor(Math.random() * 1000000);
  }

  function buildIntegrationTests(encrypted) {
    describe("with encrypted=" + encrypted, function() {
      var _VERSION, _channel_auth_transport, _channel_auth_endpoint;
      var _Dependencies;
      var pusher, pusher2;

      it("should open a connection", function() {
        // TODO fix how versions work in unit tests
        _VERSION = Pusher.VERSION;
        _channel_auth_transport = Pusher.channel_auth_transport;
        _channel_auth_endpoint = Pusher.channel_auth_endpoint;
        _Dependencies = Pusher.Dependencies;

        Pusher.VERSION = "8.8.8";
        Pusher.channel_auth_transport = 'jsonp';
        Pusher.channel_auth_endpoint = Pusher.Integration.API_URL + "/auth";
        Pusher.Dependencies = new Pusher.DependencyLoader({
          cdn_http: Pusher.Integration.JS_HOST,
          cdn_https: Pusher.Integration.JS_HOST,
          version: Pusher.VERSION,
          suffix: ""
        });

        pusher = new Pusher("7324d55a5eeb8f554761", {
          encrypted: encrypted
        });
      });

      function subscribe(pusher, channelName, callback) {
        var channel = pusher.subscribe(channelName);
        channel.bind("pusher:subscription_succeeded", function() {
          callback(channel);
        });
      }

      it("should subscribe to a public channel", function() {
        var onSubscribed = jasmine.createSpy("onSubscribed");
        var channelName = generatePseudoRandomName("integration");

        subscribe(pusher, channelName, onSubscribed);

        waitsFor(function() {
          return onSubscribed.calls.length;
        }, "subscription to succeed", 10000);
        runs(function() {
          pusher.unsubscribe(channelName);
        });
      });

      it("should subscribe to a private channel", function() {
        var onSubscribed = jasmine.createSpy("onSubscribed");
        var channelName = generatePseudoRandomName("private-integration");

        subscribe(pusher, channelName, onSubscribed);

        waitsFor(function() {
          return onSubscribed.calls.length;
        }, "subscription to succeed", 10000);
        runs(function() {
          pusher.unsubscribe(channelName);
        });
      });

      it("should receive a message sent via REST API", function() {
        var channelName = generatePseudoRandomName("integration_rest_message");
        var eventName = "integration_event";
        var data = { x: 1, y: "z" };

        var received = null;
        subscribe(pusher, channelName, function(channel) {
          channel.bind(eventName, function(message) {
            received = message;
          });

          Pusher.JSONPRequest.send({
            data: {
              channel: channelName,
              event: eventName,
              data: data
            },
            url: Pusher.Integration.API_URL + "/send",
            receiver: Pusher.JSONP
          }, function() {});
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
        var channelName = generatePseudoRandomName("integration_usubscribing");
        var eventName = "integration_event";
        var data = { x: 1, y: "z" };

        var received = null;
        subscribe(pusher, channelName, function(channel) {
          channel.bind(eventName, function(message) {
            received = message;
          });

          pusher.unsubscribe(channelName);

          Pusher.JSONPRequest.send({
            data: {
              channel: channelName,
              event: eventName,
              data: data
            },
            url: Pusher.Integration.API_URL + "/send",
            receiver: Pusher.JSONP
          }, function() {});
        });

        var timer = new Pusher.Timer(5000, function() {});
        waitsFor(function() {
          return !timer.isRunning();
        }, "timer to finish", 5100);
        runs(function() {
          expect(received).toBe(null);
        });
      });

      it("should subscribe to a presence channel", function() {
        var onSubscribed = jasmine.createSpy("onSubscribed");
        var channelName = generatePseudoRandomName("presence-integration");

        subscribe(pusher, channelName, onSubscribed);

        waitsFor(function() {
          return onSubscribed.calls.length;
        }, "subscription to succeed", 10000);
        runs(function() {
          pusher.unsubscribe(channelName);
        });
      });

      it("should open a second connection", function() {
        pusher2 = new Pusher("7324d55a5eeb8f554761", {
          encrypted: encrypted
        });
      });

      it("should receive a member added event", function() {
        var pusher1 = pusher;
        var member = null;
        var channelName = generatePseudoRandomName("presence-integration_member_added");

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
          expect(member.id).toEqual(jasmine.any(String));
          expect(member).toEqual({
            id: member.id,
            info: {
              name: "Integration " + member.id,
              email: "integration-" + member.id + "@example.com"
            }
          });
          pusher1.unsubscribe(channelName);
          pusher2.unsubscribe(channelName);
        });
      });

      it("should receive a member removed event", function() {
        var pusher1 = pusher;
        var member = null;
        var channelName = generatePseudoRandomName("presence-integration_member_removed");

        subscribe(pusher1, channelName, function(channel) {
          channel.bind("pusher:member_added", function(m) {
            channel.bind("pusher:member_removed", function(m) {
              member = m;
            });
            pusher2.unsubscribe(channelName);
          });

          subscribe(pusher2, channelName, function() {});
        });

        waitsFor(function() {
          return member !== null;
        }, "the member removed event", 10000);
        runs(function() {
          expect(member.id).toEqual(jasmine.any(String));
          expect(member).toEqual({
            id: member.id,
            info: {
              name: "Integration " + member.id,
              email: "integration-" + member.id + "@example.com"
            }
          });
          pusher1.unsubscribe(channelName);
        });
      });

      it("should receive a client event sent by another connection", function() {
        var pusher1 = pusher;

        var channelName = generatePseudoRandomName("private-integration-client-events");
        var channel1 = null;
        var channel2 = null;

        subscribe(pusher, channelName, function(c) {
          channel1 = c;
          subscribe(pusher2, channelName, function(c) {
            channel2 = c;
          });
        });

        var eventName = "client-test";
        var data = { foo: "bar" };
        var onEvent1 = jasmine.createSpy("onEvent1");
        var onEvent2 = jasmine.createSpy("onEvent2");

        waitsFor(function() {
          return channel1 !== null && channel2 !== null;
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
          expect(onEvent1).not.toHaveBeenCalled();
          pusher.unsubscribe(channelName);
          pusher2.unsubscribe(channelName);
        });
      });

      it("should disconnect second connection", function() {
        pusher2.disconnect();
      });

      it("should disconnect first connection", function() {
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

  buildIntegrationTests(false);
  buildIntegrationTests(true);
});
