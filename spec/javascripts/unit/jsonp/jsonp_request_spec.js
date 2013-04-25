describe("JSONPRequest", function() {
  beforeEach(function() {
    var self = this;

    this.receiver = new Pusher.JSONPReceiver();
    this.options = {
      url: "http://example.com/jsonp",
      receiver: this.receiver,
      receiverName: "mock",
      tagPrefix: "_pusher_jsonp_jasmine_"
    };

    this.request = undefined;
    var send = Pusher.JSONPRequest.send;
    spyOn(Pusher, "JSONPRequest").andCallFake(function(options) {
      self.request = this;
      this.send = jasmine.createSpy("send");
      this.cleanup = jasmine.createSpy("cleanup");
    });
    Pusher.JSONPRequest.send = send;
  });

  describe("on send", function() {
    it("should send a JSONP request", function() {
      Pusher.JSONPRequest.send(
        Pusher.Util.extend(this.options, {
          data: { a: 1 }
        }),
        function() {}
      );

      expect(Pusher.JSONPRequest).toHaveBeenCalledWith({
        url: "http://example.com/jsonp",
        receiver: "mock",
        tagPrefix: "_pusher_jsonp_jasmine_"
      });
      expect(this.request.send)
        .toHaveBeenCalledWith(1, {a: 1}, jasmine.any(Function));
    });

    it("should call back after calling the receiver", function() {
      var sendCallback = jasmine.createSpy("sendCallback");
      Pusher.JSONPRequest.send(
        Pusher.Util.extend(this.options, {
          data: { a: 1 }
        }),
        sendCallback
      );

      expect(sendCallback).not.toHaveBeenCalled();
      this.receiver.receive(1, "x", "y");
      expect(sendCallback).toHaveBeenCalledWith("x", "y");
    });

    it("should clean up after calling the receiver", function() {
      Pusher.JSONPRequest.send(
        Pusher.Util.extend(this.options, {
          data: { a: 1 }
        }),
        function() {}
      );
      this.receiver.receive(1, "x", "y");
      expect(this.request.cleanup).toHaveBeenCalled();
    });
  });

  describe("on error", function() {
    it("should call back with the error", function() {
      var sendCallback = jasmine.createSpy("sendCallback");
      Pusher.JSONPRequest.send(
        Pusher.Util.extend(this.options, {
          data: { a: 1 }
        }),
        sendCallback
      );
      this.request.send.calls[0].args[2]("boom");

      expect(sendCallback).toHaveBeenCalledWith("boom", undefined);
    });

    it("should unregister from the receiver", function() {
      spyOn(this.receiver, "unregister");

      Pusher.JSONPRequest.send(
        Pusher.Util.extend(this.options, {
          data: { a: 1 }
        }),
        function() {}
      );

      this.request.send.calls[0].args[2]("boom");

      expect(this.receiver.unregister).toHaveBeenCalledWith(1);
    });
  });
});
