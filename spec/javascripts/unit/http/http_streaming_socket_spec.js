describe("HTTP.getStreamingSocket", function() {
  var hooks;
  var url;
  var socket;

  beforeEach(function() {
    spyOn(Pusher.HTTP, "Socket").andCallFake(function(h, u) {
      socket = Pusher.Mocks.getHTTPSocket();
      hooks = h;
      url = u;
      return socket;
    });
  });

  it("should pass the correct url", function() {
    Pusher.HTTP.getStreamingSocket("http://example.org/xyz");
    expect(url).toEqual("http://example.org/xyz");
  });

  describe("hooks", function() {
    beforeEach(function() {
      Pusher.HTTP.getStreamingSocket("http://example.com");
    });

    it("#getReceiveURL should generate a correct streaming URL", function() {
      var url = { base: "foo/bar", queryString: "?foo=bar" };
      var session = "012/asdf";
      expect(hooks.getReceiveURL(url, session)).toEqual(
        "foo/bar/012/asdf/xhr_streaming?foo=bar"
      );
    });

    it("#onHeartbeat should send an '[]' frame", function() {
      hooks.onHeartbeat(socket);
      expect(socket.sendRaw).toHaveBeenCalledWith("[]");
      expect(socket.sendRaw.calls.length).toEqual(1);
    });

    it("#sendHeartbeat should send an '[]' frame", function() {
      hooks.sendHeartbeat(socket);
      expect(socket.sendRaw).toHaveBeenCalledWith("[]");
      expect(socket.sendRaw.calls.length).toEqual(1);
    });

    it("#onFinished should close the socket", function() {
      hooks.onFinished(socket, 200);
      expect(socket.onClose).toHaveBeenCalledWith(
        1006, "Connection interrupted (200)", false
      );
      expect(socket.onClose.calls.length).toEqual(1);
    });
  });
});
