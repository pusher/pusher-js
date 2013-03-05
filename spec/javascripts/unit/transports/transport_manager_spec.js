describe("TransportManager", function() {
  var transport, transportClass;
  var manager;

  beforeEach(function() {
    transport = Pusher.Mocks.getTransport(true);
    transportClass = Pusher.Mocks.getTransportClass(true, transport);
    manager = new Pusher.TransportManager(transportClass);

    jasmine.Clock.useMock();
    spyOn(Pusher.Util, "now").andReturn(1);
  });

  describe("#isSupported", function() {
    it("should return true when transport is supported", function() {
      var manager = new Pusher.TransportManager(
        Pusher.Mocks.getTransportClass(true)
      );
      expect(manager.isSupported()).toBe(true);
    });

    it("should return false when transport is not supported", function() {
      var manager = new Pusher.TransportManager(
        Pusher.Mocks.getTransportClass(false)
      );
      expect(manager.isSupported()).toBe(false);
    });

    it("should return true after transport died once", function() {
      manager.createConnection("x", 1, "a", {});
      transport.emit("open");
      transport.emit("closed", { wasClean: false });
      expect(manager.isSupported()).toBe(true);
    });

    it("should return false after transport died twice", function() {
      manager.createConnection("x", 1, "a", {});
      transport.emit("open");
      transport.emit("closed", { wasClean: false });
      manager.createConnection("x", 1, "a", {});
      transport.emit("open");
      transport.emit("closed", { wasClean: false });
      expect(manager.isSupported()).toBe(false);
    });

    it("should return true after transport closed cleanly twice", function() {
      manager.createConnection("x", 1, "a", {});
      transport.emit("open");
      transport.emit("closed", { wasClean: true });
      manager.createConnection("x", 1, "a", {});
      transport.emit("open");
      transport.emit("closed", { wasClean: true });
      expect(manager.isSupported()).toBe(true);
    });
  });

  describe("#createConnection", function() {
    it("should pass parameters to the transport", function() {
      manager.createConnection("foo", 66, "abc", { test: true });
      expect(transportClass.createConnection)
        .toHaveBeenCalledWith("foo", 66, "abc", { test: true });
    });

    it("should return the transport instance", function() {
      var connection = manager.createConnection("x", 1, "a", {});
      expect(connection).toBe(transport);
    });
  });

  describe("after an opened connection dies after less than 2 minutes", function() {
    var connection;

    beforeEach(function() {
      connection = manager.createConnection("x", 1, "a", {});
      Pusher.Util.now.andReturn(1);
      connection.emit("open");
      Pusher.Util.now.andReturn(110001);
      connection.emit("closed", { wasClean: false });
    });

    it("should send activity checks on the next connection", function() {
      var connection = manager.createConnection("x", 1, "a", {});
      connection.emit("open");

      expect(connection.requestPing).not.toHaveBeenCalled();
      jasmine.Clock.tick(54999);
      expect(connection.requestPing).not.toHaveBeenCalled();
      jasmine.Clock.tick(1);
      expect(connection.requestPing.calls.length).toEqual(1);
      jasmine.Clock.tick(55000);
      expect(connection.requestPing.calls.length).toEqual(2);
    });

    it("should stop sending activity checks on closed connections", function() {
      var connection = manager.createConnection("x", 1, "a", {});
      connection.emit("open");
      connection.emit("closed", { wasClean: true });
      jasmine.Clock.tick(100000);
      expect(connection.requestPing).not.toHaveBeenCalled();
    });
  });

  describe("after an opened connection dies after more than 2 minutes", function() {
    var connection;

    beforeEach(function() {
      connection = manager.createConnection("x", 1, "a", {});
      Pusher.Util.now.andReturn(1);
      connection.emit("open");
      Pusher.Util.now.andReturn(120002);
      connection.emit("closed", { wasClean: false });
    });

    it("should not send activity checks on next connection", function() {
      var connection = manager.createConnection("x", 1, "a", {});
      connection.emit("open");
      jasmine.Clock.tick(100000);
      expect(connection.requestPing).not.toHaveBeenCalled();
    });
  });

  describe("after an opened connection closes cleanly", function() {
    var connection;

    beforeEach(function() {
      connection = manager.createConnection("x", 1, "a", {});
      Pusher.Util.now.andReturn(1);
      connection.emit("open");
      Pusher.Util.now.andReturn(100001);
      connection.emit("closed", { wasClean: true });
    });

    it("should not send activity checks on next connection", function() {
      var connection = manager.createConnection("x", 1, "a", {});
      connection.emit("open");
      jasmine.Clock.tick(1000000);
      expect(connection.requestPing).not.toHaveBeenCalled();
    });
  });
});
