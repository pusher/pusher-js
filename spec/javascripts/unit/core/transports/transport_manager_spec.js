var Mocks = require("mocks");
var Factory = require('core/utils/factory').default;
var TransportManager = require('core/transports/transport_manager').default;
var AssistantToTheTransportManager = require('core/transports/assistant_to_the_transport_manager').default;

describe("TransportManager", function() {
  it("should create an assistant for a transport class", function() {
    var transportClass = Mocks.getTransportClass(true);
    var assistant = Mocks.getAssistantToTheTransportManager();
    var manager = new TransportManager({
      minPingDelay: 1111,
      maxPingDelay: 2222
    });

    spyOn(Factory, 'createAssistantToTheTransportManager').and.returnValue(assistant);

    expect(manager.getAssistant(transportClass)).toBe(assistant);
    expect(Factory.createAssistantToTheTransportManager).toHaveBeenCalledWith(
      manager, transportClass, { minPingDelay: 1111, maxPingDelay: 2222 }
    );
  });

  describe("with initial two lives", function() {
    var manager;

    beforeEach(function() {
      manager = new TransportManager({ lives: 2 });
    });

    it("should be alive in the beginning", function() {
      expect(manager.isAlive()).toBe(true);
    });

    it("should be alive after losing one life", function() {
      manager.reportDeath();
      expect(manager.isAlive()).toBe(true);
    });

    it("should be dead after losing both lives", function() {
      manager.reportDeath();
      manager.reportDeath();
      expect(manager.isAlive()).toBe(false);
    });
  });

  describe("with unlimited number of lives", function() {
    var manager;

    beforeEach(function() {
      manager = new TransportManager();
    });

    it("should be alive in the beginning", function() {
      expect(manager.isAlive()).toBe(true);
    });

    it("should be alive after losing lots of lives", function() {
      for (var i = 0; i < 666; i++) {
        manager.reportDeath();
      }
      expect(manager.isAlive()).toBe(true);
    });
  });
});
