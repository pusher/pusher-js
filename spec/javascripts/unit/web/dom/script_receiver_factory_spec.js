var ScriptReceiverFactory = require('dom/script_receiver_factory').ScriptReceiverFactory;

describe("ScriptReceiverFactory", function() {
  var receivers;
  var callback1, callback2;
  var receiver1, receiver2;

  beforeEach(function() {
    receivers = new ScriptReceiverFactory("test_prefix", "Recv");
    callback1 = jasmine.createSpy();
    callback2 = jasmine.createSpy();
    receiver1 = receivers.create(callback1);
    receiver2 = receivers.create(callback2);
  });

  describe("#create", function() {
    it("should set sequential ids with the supplied prefix", function() {
      expect(receiver1.id).toEqual("test_prefix1");
      expect(receiver2.id).toEqual("test_prefix2");
    });

    it("should set correct names", function() {
      expect(receiver1.name).toEqual("Recv[1]");
      expect(receiver2.name).toEqual("Recv[2]");
    });

    it("should set correct callbacks", function() {
      expect(callback1).not.toHaveBeenCalled();
      expect(callback2).not.toHaveBeenCalled();

      receiver1.callback();
      expect(callback1).toHaveBeenCalled();
      expect(callback2).not.toHaveBeenCalled();

      receiver2.callback();
      expect(callback1).toHaveBeenCalled();
      expect(callback2).toHaveBeenCalled();
    });

    it("should bind correct callbacks to the factory", function() {
      expect(callback1).not.toHaveBeenCalled();
      expect(callback2).not.toHaveBeenCalled();

      receivers[1]();
      expect(callback1).toHaveBeenCalled();
      expect(callback2).not.toHaveBeenCalled();

      receivers[2]();
      expect(callback1).toHaveBeenCalled();
      expect(callback2).toHaveBeenCalled();
    });
  });

  describe("#remove", function() {
    it("should unbind correct callbacks from the factory", function() {
      expect(receivers[1]).not.toEqual(undefined);
      expect(receivers[2]).not.toEqual(undefined);

      receivers.remove(receiver1);
      expect(receivers[1]).toEqual(undefined);
      expect(receivers[2]).not.toEqual(undefined);

      receivers.remove(receiver2);
      expect(receivers[1]).toEqual(undefined);
      expect(receivers[2]).toEqual(undefined);
    });
  });
});
