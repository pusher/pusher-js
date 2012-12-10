Pusher.Mocks = {
  getTransport: function() {
    var transport = new Pusher.EventsDispatcher();

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
    strategy._callback = null;

    strategy.isSupported = jasmine.createSpy("isSupported")
      .andReturn(isSupported);
    strategy.connect = jasmine.createSpy("connect")
      .andCallFake(function(callback) {
        strategy._callback = callback;
        return { abort: strategy._abort };
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
  }
};
