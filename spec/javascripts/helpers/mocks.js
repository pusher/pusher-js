var EventsDispatcher = require('core/events/dispatcher').default;

var Mocks = {
  getScriptRequest: function() {
    return {
      send: jasmine.createSpy("send"),
      cleanup: jasmine.createSpy("cleanup")
    };
  },

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
      abort: jasmine.createSpy("abort"),
      setRequestHeader: jasmine.createSpy("setRequestHeader")
    };
  },

  getWebSocket: function() {
    return {
      send: jasmine.createSpy("send"),
      close: jasmine.createSpy("close")
    };
  },

  getHTTPSocket: function() {
    var socket = new EventsDispatcher();
    socket.close = jasmine.createSpy("close");
    socket.sendRaw = jasmine.createSpy("sendRaw");
    socket.onChunk = jasmine.createSpy("onChunk");
    socket.onClose = jasmine.createSpy("onClose");
    socket.reconnect = jasmine.createSpy("sendRaw");
    return socket;
  },

  getHTTPRequest: function(method, url) {
    var request = new EventsDispatcher();
    request.start = jasmine.createSpy("start");
    request.close = jasmine.createSpy("close");
    request.method = method;
    request.url = url;
    return request;
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
      send: jasmine.createSpy("send")
    };

    return sender;
  },

  getTransport: function() {
    var transport = new EventsDispatcher();

    transport.handlesActivityChecks = jasmine.createSpy("handlesActivityChecks")
      .andReturn(false);
    transport.supportsPing = jasmine.createSpy("supportsPing")
      .andReturn(false);
    transport.initialize = jasmine.createSpy("initialize")
      .andCallFake(function() {
        transport.state = "initializing";
        transport.emit("initializing");
      });
    transport.connect = jasmine.createSpy("connect");
    transport.send = jasmine.createSpy("send")
      .andReturn(true);
    transport.ping = jasmine.createSpy("ping");
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
        .andReturn(transport || this.getTransport()),
      isSupported: jasmine.createSpy("isSupported")
        .andReturn(true)
    };
  },

  getTransportClass: function(supported, transport) {
    var klass = {};

    klass.isSupported = jasmine.createSpy("isSupported")
      .andReturn(supported);
    klass.createConnection = jasmine.createSpy("createConnection")
      .andReturn(transport || this.getTransport());

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
    var strategy = new EventsDispatcher();

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
      strategies.push(this.getStrategy(isSupportedList[i]));
    }
    return strategies;
  },

  getConnection: function() {
    var connection = new EventsDispatcher();

    connection.initialize = jasmine.createSpy("initialize");
    connection.connect = jasmine.createSpy("connect");
    connection.handlesActivityChecks = jasmine.createSpy("handlesActivityChecks")
      .andReturn(false);
    connection.supportsPing = jasmine.createSpy("supportsPing")
      .andReturn(false);
    connection.send = jasmine.createSpy("send")
      .andReturn(true);
    connection.ping = jasmine.createSpy("ping")
      .andReturn(true);
    connection.send_event = jasmine.createSpy("send_event")
      .andReturn(true);
    connection.close = jasmine.createSpy("close");

    return connection;
  },

  getConnectionManager: function(socket_id) {
    var manager = new EventsDispatcher();
    manager.socket_id = socket_id || "1.1";
    manager.connect = jasmine.createSpy("connect");
    manager.disconnect = jasmine.createSpy("disconnect");
    manager.send_event = jasmine.createSpy("send_event");
    manager.isUsingTLS = jasmine.createSpy("isUsingTLS").andReturn(false);
    return manager;
  },

  getPusher: function(config) {
    var pusher = new EventsDispatcher();
    pusher.config = config;
    pusher.unsubscribe = jasmine.createSpy("unsubscribe");
    pusher.send_event = jasmine.createSpy("send_event");
    return pusher;
  },

  getChannel: function(name) {
    var channel = new EventsDispatcher();
    channel.name = name;
    channel.authorize = jasmine.createSpy("authorize");
    channel.cancelSubscription = jasmine.createSpy("cancelSubscription");
    channel.disconnect = jasmine.createSpy("disconnect");
    channel.handleEvent = jasmine.createSpy("handleEvent");
    channel.reinstateSubscription = jasmine.createSpy("reinstateSubscription");
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

module.exports = Mocks;
