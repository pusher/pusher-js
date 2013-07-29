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
        insertBefore: jasmine.createSpy("insertBefore"),
        appendChild: jasmine.createSpy("appendChild")
      };
    },

    getXHR: function() {
      return {
        open: jasmine.createSpy("open"),
        send: jasmine.createSpy("send"),
        setRequestHeader: jasmine.createSpy("setRequestHeader")
      };
    },

    getDependencies: function() {
      return {
        load: jasmine.createSpy("load"),
        getRoot: jasmine.createSpy("getRoot"),
        getPath: jasmine.createSpy("getPath")
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
      var sender = {
        isEncrypted: jasmine.createSpy("isEncrypted"),
        send: jasmine.createSpy("send")
      };
      sender.getEncrypted = jasmine.createSpy("getEncrypted").andReturn(sender);

      return sender;
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
      transport.send = jasmine.createSpy("send")
        .andReturn(true);
      transport.requestPing = jasmine.createSpy("requestPing");
      transport.close = jasmine.createSpy("close");
      transport.state = undefined;

      return transport;
    },

    getTransportManager: function(alive) {
      return {
        isAlive: jasmine.createSpy("isAlive").andReturn(alive !== false),
        reportDeath: jasmine.createSpy("reportDeath")
      };
    },

    getAssistantToTheTransportManager: function(transport) {
      return {
        createConnection: jasmine.createSpy("createConnection")
          .andReturn(transport || Pusher.Mocks.getTransport()),
        isSupported: jasmine.createSpy("isSupported")
          .andReturn(true)
      };
    },

    getTransportClass: function(supported, transport) {
      var klass = {};

      klass.isSupported = jasmine.createSpy("isSupported")
        .andReturn(supported);
      klass.createConnection = jasmine.createSpy("createConnection")
        .andReturn(transport || Pusher.Mocks.getTransport());

      return klass;
    },

    getHandshake: function(transport, callback) {
      return {
        close: jasmine.createSpy("close"),

        _transport: transport,
        _callback: callback
      };
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

      connection.initialize = jasmine.createSpy("initialize");
      connection.connect = jasmine.createSpy("connect");
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
      manager.isEncrypted = jasmine.createSpy("isEncrypted").andReturn(false);
      return manager;
    },

    getPusher: function(config) {
      var pusher = new Pusher.EventsDispatcher();
      pusher.config = config;
      pusher.send_event = jasmine.createSpy("send_event");
      return pusher;
    },

    getChannel: function(name) {
      var channel = new Pusher.EventsDispatcher();
      channel.name = name;
      channel.authorize = jasmine.createSpy("authorize");
      channel.disconnect = jasmine.createSpy("disconnect");
      channel.handleEvent = jasmine.createSpy("handleEvent");
      channel.subscribe = jasmine.createSpy("subscribe");
      channel.unsubscribe = jasmine.createSpy("unsubscribe");
      return channel;
    },

    getAuthorizer: function() {
      var authorizer = {};
      authorizer._callback = null;
      authorizer.authorize = jasmine.createSpy("authorize").andCallFake(function(_, callback) {
        authorizer._callback = callback;
      });
      return authorizer;
    }
  };
}).call(this);
