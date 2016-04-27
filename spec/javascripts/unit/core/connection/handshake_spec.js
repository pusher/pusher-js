var Handshake = require('core/connection/handshake').default;
var Protocol = require('core/connection/protocol/protocol');
var Connection = require('core/connection/connection').default;
var Mocks = require("mocks");

describe("Handshake", function() {
  var transport;
  var callback;
  var handshake;

  beforeEach(function() {
    transport = Mocks.getTransport();
    callback = jasmine.createSpy("callback");
    spyOn(Protocol, "processHandshake");

    handshake = new Handshake(transport, callback);
  });

  describe("after a successful handshake", function() {
    beforeEach(function() {
      Protocol.processHandshake.andReturn({
        action: "connected",
        id: "9.9"
      });
      transport.emit("message", { data: "dummy" });
    });

    it("should call back with a connection", function() {
      expect(callback).toHaveBeenCalledWith({
        action: "connected",
        transport: transport,
        connection: jasmine.any(Connection)
      });
      expect(callback.calls[0].args[0].connection.id).toEqual("9.9");
    });

    it("should not call close on the transport", function() {
      expect(transport.close).not.toHaveBeenCalled();
    });
  });

  describe("after a handshake with other action", function() {
    beforeEach(function() {
      Protocol.processHandshake.andReturn({
        action: "boom",
        error: "BOOM"
      });
      transport.emit("message", { data: "dummy "});
    });

    it("should call back with correct action and error", function() {
      expect(callback).toHaveBeenCalledWith({
        action: "boom",
        transport: transport,
        error: "BOOM"
      });
    });

    it("should call close on the transport", function() {
      expect(transport.close).toHaveBeenCalled();
    });
  });

  describe("after a handshake raising an exception", function() {
    beforeEach(function() {
      Protocol.processHandshake.andThrow("Invalid handshake");
      transport.emit("message", { data: "dummy "});
    });

    it("should call back with an 'error' action", function() {
      expect(callback).toHaveBeenCalledWith({
        action: "error",
        transport: transport,
        error: "Invalid handshake"
      });
    });

    it("should call close on the transport", function() {
      expect(transport.close).toHaveBeenCalled();
    });
  });

  describe("on connection exception", function(){
    it("should throw an error", function(){
      var finishSpy = spyOn(handshake, 'finish');
      var error = new Error("some exception");

      finishSpy.andCallFake(function(action, params){
        if (action === "connected") {
          throw error
        } else {
          finishSpy.andCallThrough();
        }
      });

      Protocol.processHandshake.andReturn({
        action: "connected",
        id: "9.9"
      });

      expect(function(){
        transport.emit("message", {data: "dummy"});
      }).toThrow(error);
    });
  })

  describe("after receiving a 'closed' event from transport", function() {
    describe("with defined action", function() {
      beforeEach(function() {
        spyOn(Protocol, "getCloseAction").andReturn("boo");
        spyOn(Protocol, "getCloseError");

        transport.emit("closed", {
          code: 4321,
          reason: "test"
        });
      });

      it("should call back with correct action and error", function() {
        expect(callback).toHaveBeenCalledWith({
          action: "boo",
          transport: transport
        });
      });

      it("should not close the transport", function() {
        expect(transport.close).not.toHaveBeenCalled();
      });

      it("should call protocol methods with correct arguments", function() {
        expect(Protocol.getCloseAction).toHaveBeenCalledWith({
          code: 4321,
          reason: "test"
        });
      });
    });

    describe("with null action", function() {
      beforeEach(function() {
        spyOn(Protocol, "getCloseAction").andReturn(null);
        spyOn(Protocol, "getCloseError").andReturn("???");

        transport.emit("closed", {
          code: 4321,
          reason: "???"
        });
      });

      it("should call back with 'backoff' action and error", function() {
        expect(callback).toHaveBeenCalledWith({
          action: "backoff",
          error: "???",
          transport: transport
        });
      });
    });
  });
});
