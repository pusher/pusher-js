var Mocks = require("mocks");
var AssistantToTheTransportManager = require('core/transports/assistant_to_the_transport_manager').default;
var Util = require('core/util').default;

describe("AssistantToTheTransportManager", function() {
  var transport, transportClass;
  var manager;

  beforeEach(function() {
    jasmine.Clock.useMock();
    spyOn(Util, "now").andReturn(1);

    transport = Mocks.getTransport(true);
    transportManager = Mocks.getTransportManager();
    transportClass = Mocks.getTransportClass(true, transport);

    assistant = new AssistantToTheTransportManager(
      transportManager,
      transportClass,
      { minPingDelay: 10000, maxPingDelay: 120000 }
    );
  });

  describe("#isSupported", function() {
    it("should return true when transport is supported", function() {
      var assistant = new AssistantToTheTransportManager(
        transportManager,
        Mocks.getTransportClass(true),
        { minPingDelay: 10000, maxPingDelay: 50000 }
      );
      expect(assistant.isSupported()).toBe(true);
    });

    it("should return false when transport is not supported", function() {
      var assistant = new AssistantToTheTransportManager(
        transportManager,
        Mocks.getTransportClass(false),
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

  describe("after an opened connection closed with a protocol error (code 1002)", function() {
    var connection;

    beforeEach(function() {
      connection = assistant.createConnection("x", 1, "a", {});
      Util.now.andReturn(1);
      connection.emit("open");
      Util.now.andReturn(100001);
      connection.emit("closed", { wasClean: true, code: 1002 });
    });

    it("should report its death to the manager", function() {
      expect(transportManager.reportDeath).toHaveBeenCalled();
    });
  });

  describe("after an opened connection closed with a unsupported error (code 1003)", function() {
    var connection;

    beforeEach(function() {
      connection = assistant.createConnection("x", 1, "a", {});
      Util.now.andReturn(1);
      connection.emit("open");
      Util.now.andReturn(100001);
      connection.emit("closed", { wasClean: true, code: 1003 });
    });

    it("should report its death to the manager", function() {
      expect(transportManager.reportDeath).toHaveBeenCalled();
    });
  });

  describe("after an opened connection died after less than 2*maxPingDelay", function() {
    var connection;
    var assistant;

    beforeEach(function() {
      assistant = new AssistantToTheTransportManager(
        transportManager,
        transportClass,
        { minPingDelay: 10000, maxPingDelay: 100000 }
      );
      connection = assistant.createConnection("x", 1, "a", {});
      Util.now.andReturn(1);
      connection.emit("open");
      Util.now.andReturn(190001);
      connection.emit("closed", { wasClean: false });
    });

    it("should report its death once to the manager", function() {
      expect(transportManager.reportDeath.calls.length).toEqual(1);
    });

    it("should set the activity timeout on the next connection to lifetime/2 ms", function() {
      var connection = assistant.createConnection("x", 1, "a", {});
      expect(transportClass.createConnection).toHaveBeenCalledWith(
        "x", 1, "a", { activityTimeout: 95000 }
      );
    });
  });

  describe("after an opened connection died after more than 2*maxPingDelay", function() {
    var connection;
    var assistant;

    beforeEach(function() {
      assistant = new AssistantToTheTransportManager(
        transportManager,
        transportClass,
        { minPingDelay: 10000, maxPingDelay: 50000 }
      );
      connection = assistant.createConnection("x", 1, "a", {});
      Util.now.andReturn(1);
      connection.emit("open");
      Util.now.andReturn(100002);
      connection.emit("closed", { wasClean: false });
    });

    it("should not report its death to the manager", function() {
      expect(transportManager.reportDeath).not.toHaveBeenCalled();
    });

    it("should not set the activity timeout on the next connection", function() {
      var connection = assistant.createConnection("x", 1, "a", {});
      expect(transportClass.createConnection).toHaveBeenCalledWith(
        "x", 1, "a", {}
      );
    });
  });

  describe("after an opened connection died after less than 2*minPingDelay", function() {
    var connection;
    var assistant;

    beforeEach(function() {
      assistant = new AssistantToTheTransportManager(
        transportManager,
        transportClass,
        { minPingDelay: 20000, maxPingDelay: 100000 }
      );
      connection = assistant.createConnection("x", 1, "a", {});
      Util.now.andReturn(1);
      connection.emit("open");
      Util.now.andReturn(32001);
      connection.emit("closed", { wasClean: false });
    });

    it("should report its death once to the manager", function() {
      expect(transportManager.reportDeath.calls.length).toEqual(1);
    });

    it("should set the activity timeout on the next connection to minPingDelay ms", function() {
      var connection = assistant.createConnection("x", 1, "a", {});
      expect(transportClass.createConnection).toHaveBeenCalledWith(
        "x", 1, "a", { activityTimeout: 20000 }
      );
    });
  });

  describe("after an opened connection closed cleanly", function() {
    var connection;

    beforeEach(function() {
      connection = assistant.createConnection("x", 1, "a", {});
      Util.now.andReturn(1);
      connection.emit("open");
      Util.now.andReturn(100001);
      connection.emit("closed", { wasClean: true });
    });

    it("should not report its death to the manager", function() {
      expect(transportManager.reportDeath).not.toHaveBeenCalled();
    });

    it("should not set the activity timeout on the next connection", function() {
      var connection = assistant.createConnection("x", 1, "a", {});
      expect(transportClass.createConnection).toHaveBeenCalledWith(
        "x", 1, "a", {}
      );
    });
  });
});
