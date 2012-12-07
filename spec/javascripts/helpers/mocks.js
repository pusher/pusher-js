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
    var klass = new Object();

    klass.isSupported = jasmine.createSpy("isSupported")
      .andReturn(supported);
    klass.createConnection = jasmine.createSpy("createConnection")
      .andReturn(transport || Pusher.Mocks.getTransport());

    return klass;
  }
};
