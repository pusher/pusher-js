;(function() {
  Pusher.Mocks = {
    getDocument: function() {
      return {
        location: {
          protocol: "http:"
        },

        getElementsByTagName: jasmine.createSpy("getElementsByTagName"),
        createElement: jasmine.createSpy("createElement"),
        addEventListener: jasmine.createSpy("addEventListener")
      };
    },

    getDocumentElement: function() {
      return {
        setAttribute: jasmine.createSpy("setAttribute"),
        addEventListener: jasmine.createSpy("addEventListener"),
        appendChild: jasmine.createSpy("appendChild")
      };
    },

    getJSONPSender: function() {
      return {
        send: jasmine.createSpy("send")
      };
    },

    getTimeline: function() {
      return {
        log: jasmine.createSpy("log"),
        error: jasmine.createSpy("error"),
        info: jasmine.createSpy("info"),
        debug: jasmine.createSpy("debug"),
        send: jasmine.createSpy("send"),
        isEmpty: jasmine.createSpy("isEmpty"),
        generateUniqueID: jasmine.createSpy("generateUniqueID")
      };
    },

    getTimelineSender: function() {
      return {
        isEncrypted: jasmine.createSpy("isEncrypted"),
        send: jasmine.createSpy("send")
      };
    },

    getTransport: function() {
      var transport = new Pusher.EventsDispatcher();

      transport.supportsPing = jasmine.createSpy("supportsPing")
        .andReturn(true);
      transport.initialize = jasmine.createSpy("initialize")
        .andCallFake(function() {
          transport.state = "initializing";
          transport.emit("initializing");
        });
      transport.connect = jasmine.createSpy("connect");
      transport.close = jasmine.createSpy("close");
      transport.state = undefined;

      return transport;
    },

    getTransportClass: function(supported, transport) {
      var klass = {};

      klass.isSupported = jasmine.createSpy("isSupported")
        .andReturn(supported);
      klass.createConnection = jasmine.createSpy("createConnection")
        .andReturn(transport || Pusher.Mocks.getTransport());

      return klass;
    },

    getStrategy: function(isSupported) {
      var strategy = new Pusher.EventsDispatcher();

      strategy._abort = jasmine.createSpy();
      strategy._forceMinPriority = jasmine.createSpy();
      strategy._callback = null;

      strategy.isSupported = jasmine.createSpy("isSupported")
        .andReturn(isSupported);
      strategy.connect = jasmine.createSpy("connect")
        .andCallFake(function(minPriority, callback) {
          strategy._callback = callback;
          return {
            abort: strategy._abort,
            forceMinPriority: strategy._forceMinPriority
          };
        });

      return strategy;
    },

    getStrategies: function(isSupportedList) {
      var strategies = [];
      for (var i = 0; i < isSupportedList.length; i++) {
        strategies.push(Pusher.Mocks.getStrategy(isSupportedList[i]));
      }
      return strategies;
    },

    getConnection: function() {
      var connection = new Pusher.EventsDispatcher();

      connection.supportsPing = jasmine.createSpy("supportsPing")
        .andReturn(false);
      connection.send = jasmine.createSpy("send")
        .andReturn(true);
      connection.send_event = jasmine.createSpy("send_event")
        .andReturn(true);
      connection.close = jasmine.createSpy("close");

      return connection;
    },

    getConnectionManager: function(socket_id) {
      var manager = new Pusher.EventsDispatcher();
      manager.socket_id = socket_id || "1.1";
      manager.connect = jasmine.createSpy("connect");
      manager.disconnect = jasmine.createSpy("disconnect");
      manager.send_event = jasmine.createSpy("send_event");
      return manager;
    },

    getChannel: function(name) {
      var channel = new Pusher.EventsDispatcher();
      channel.name = name;
      channel.authorize = jasmine.createSpy("authorize");
      channel.disconnect = jasmine.createSpy("disconnect");
      return channel;
    }
  };
}).call(this);
