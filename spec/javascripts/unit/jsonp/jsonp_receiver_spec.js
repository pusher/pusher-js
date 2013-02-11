describe("JSONPReceiver", function() {
  beforeEach(function() {
    this.receiver = new Pusher.JSONPReceiver();
  });

  it("should expose a receiver on Pusher.JSONP", function() {
    expect(Pusher.JSONP).toEqual(jasmine.any(Pusher.JSONPReceiver));
  });

  describe("on register", function() {
    it("should return an id for the callback", function() {
      expect(this.receiver.register(function() {}))
        .toEqual(jasmine.any(Number));
    });
  });

  describe("on unregister", function() {
    it("should return the callback", function() {
      var callback = function() {};
      var id = this.receiver.register(callback);
      expect(this.receiver.unregister(id)).toBe(callback);
    });
  });

  describe("on call", function() {
    it("should call a registered callback once on receive", function() {
      var callback = jasmine.createSpy("receivedCallback");
      var id = this.receiver.register(callback);

      expect(callback).not.toHaveBeenCalled();
      this.receiver.receive(id, "x", "y");
      expect(callback).toHaveBeenCalledWith("x", "y");
      expect(callback.calls.length).toEqual(1);
    });

    it("should not call the same callback twice", function() {
      var callback = jasmine.createSpy("receivedCallback");
      var id = this.receiver.register(callback);

      this.receiver.receive(id, "x", "y");
      this.receiver.receive(id, "a", "b");
      expect(callback).toHaveBeenCalledWith("x", "y");
      expect(callback.calls.length).toEqual(1);
    });

    it("should not call an unregistered callback", function() {
      var callback = jasmine.createSpy("receivedCallback");
      var id = this.receiver.register(callback);

      this.receiver.unregister(id);
      this.receiver.receive(id);
      expect(callback).not.toHaveBeenCalled();
    });
  });
});
