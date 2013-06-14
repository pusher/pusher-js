describe("AssistantToTheTransportManager", function() {
  var transport, transportClass;
  var manager;

  beforeEach(function() {
    jasmine.Clock.useMock();
    spyOn(Pusher.Util, "now").andReturn(1);

    transport = Pusher.Mocks.getTransport(true);
    transportManager = Pusher.Mocks.getTransportManager();
    transportClass = Pusher.Mocks.getTransportClass(true, transport);

    assistant = new Pusher.AssistantToTheTransportManager(
      transportManager,
      transportClass,
      { minPingDelay: 10000, maxPingDelay: 120000 }
    );
  });

  describe("#isSupported", function() {
    it("should return true when transport is supported", function() {
      var assistant = new Pusher.AssistantToTheTransportManager(
        transportManager,
        Pusher.Mocks.getTransportClass(true),
        { minPingDelay: 10000, maxPingDelay: 50000 }
      );
      expect(assistant.isSupported()).toBe(true);
    });

    it("should return false when transport is not supported", function() {
      var assistant = new Pusher.AssistantToTheTransportManager(
        transportManager,
        Pusher.Mocks.getTransportClass(false),
        { minPingDelay: 10000, maxPingDelay: 50000 }
      );
      expect(assistant.isSupported()).toBe(false);
    });

    it("should return true if transport is alive", function() {
      transportManager.isAlive.andReturn(true);
      expect(assistant.isSupported()).toBe(true);
    });

    it("should return false if transport is not alive", function() {
      transportManager.isAlive.andReturn(false);
      expect(assistant.isSupported()).toBe(false);
    });

    it("should pass the environment to the transport", function() {
      assistant.isSupported({ disableFlash: true });
      expect(transportClass.isSupported)
        .toHaveBeenCalledWith({ disableFlash: true });
    });
  });

  describe("#createConnection", function() {
    it("should pass parameters to the transport", function() {
      assistant.createConnection("foo", 66, "abc", { test: true });
      expect(transportClass.createConnection)
        .toHaveBeenCalledWith("foo", 66, "abc", { test: true });
    });

    it("should return the transport instance", function() {
      var connection = assistant.createConnection("x", 1, "a", {});
      expect(connection).toBe(transport);
    });
  });

  describe("after an opened connection died after less than 2*maxPingDelay", function() {
    var connection;
    var assistant;

    beforeEach(function() {
      assistant = new Pusher.AssistantToTheTransportManager(
        transportManager,
        transportClass,
        { minPingDelay: 10000, maxPingDelay: 100000 }
      );
      connection = assistant.createConnection("x", 1, "a", {});
      Pusher.Util.now.andReturn(1);
      connection.emit("open");
      Pusher.Util.now.andReturn(190001);
      connection.emit("closed", { wasClean: false });
    });

    it("should report its death once to the manager", function() {
      expect(transportManager.reportDeath.calls.length).toEqual(1);
    });

    it("should send activity checks on the next connection every lifetime/2 ms", function() {
      var connection = assistant.createConnection("x", 1, "a", {});
      connection.emit("open");

      expect(connection.requestPing).not.toHaveBeenCalled();
      jasmine.Clock.tick(94999);
      expect(connection.requestPing).not.toHaveBeenCalled();
      jasmine.Clock.tick(1);
      expect(connection.requestPing.calls.length).toEqual(1);
      jasmine.Clock.tick(95000);
      expect(connection.requestPing.calls.length).toEqual(2);
    });

    it("should stop sending activity checks on closed connections", function() {
      var connection = assistant.createConnection("x", 1, "a", {});
      connection.emit("open");
      connection.emit("closed", { wasClean: true });
      jasmine.Clock.tick(100000);
      expect(connection.requestPing).not.toHaveBeenCalled();
    });
  });

  describe("after an opened connection died after more than 2*maxPingDelay", function() {
    var connection;
    var assistant;

    beforeEach(function() {
      assistant = new Pusher.AssistantToTheTransportManager(
        transportManager,
        transportClass,
        { minPingDelay: 10000, maxPingDelay: 50000 }
      );
      connection = assistant.createConnection("x", 1, "a", {});
      Pusher.Util.now.andReturn(1);
      connection.emit("open");
      Pusher.Util.now.andReturn(100002);
      connection.emit("closed", { wasClean: false });
    });

    it("should not report its death to the manager", function() {
      expect(transportManager.reportDeath).not.toHaveBeenCalled();
    });

    it("should not send activity checks on next connection", function() {
      var connection = assistant.createConnection("x", 1, "a", {});
      connection.emit("open");
      jasmine.Clock.tick(1000000);
      expect(connection.requestPing).not.toHaveBeenCalled();
    });
  });

  describe("after an opened connection died after less than 2*minPingDelay", function() {
    var connection;
    var assistant;

    beforeEach(function() {
      assistant = new Pusher.AssistantToTheTransportManager(
        transportManager,
        transportClass,
        { minPingDelay: 20000, maxPingDelay: 100000 }
      );
      connection = assistant.createConnection("x", 1, "a", {});
      Pusher.Util.now.andReturn(1);
      connection.emit("open");
      Pusher.Util.now.andReturn(32001);
      connection.emit("closed", { wasClean: false });
    });

    it("should report its death once to the manager", function() {
      expect(transportManager.reportDeath.calls.length).toEqual(1);
    });

    it("should send activity checks on the next connection every minPingDelay ms", function() {
      var connection = assistant.createConnection("x", 1, "a", {});
      connection.emit("open");

      expect(connection.requestPing).not.toHaveBeenCalled();
      jasmine.Clock.tick(19999);
      expect(connection.requestPing).not.toHaveBeenCalled();
      jasmine.Clock.tick(1);
      expect(connection.requestPing.calls.length).toEqual(1);
      jasmine.Clock.tick(20000);
      expect(connection.requestPing.calls.length).toEqual(2);
    });
  });

  describe("after an opened connection closed cleanly", function() {
    var connection;

    beforeEach(function() {
      connection = assistant.createConnection("x", 1, "a", {});
      Pusher.Util.now.andReturn(1);
      connection.emit("open");
      Pusher.Util.now.andReturn(100001);
      connection.emit("closed", { wasClean: true });
    });

    it("should not report its death to the manager", function() {
      expect(transportManager.reportDeath).not.toHaveBeenCalled();
    });

    it("should not send activity checks on next connection", function() {
      var connection = assistant.createConnection("x", 1, "a", {});
      connection.emit("open");
      jasmine.Clock.tick(1000000);
      expect(connection.requestPing).not.toHaveBeenCalled();
    });
  });
});
