describe("HTTP.getPollingSocket", function() {
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
    Pusher.HTTP.getPollingSocket("http://example.org/xyz");
    expect(url).toEqual("http://example.org/xyz");
  });

  describe("hooks", function() {
    beforeEach(function() {
      Pusher.HTTP.getPollingSocket("http://example.com");
    });

    it("#getReceiveURL should generate a correct streaming URL", function() {
      var url = { base: "foo/bar", queryString: "?foo=bar" };
      var session = "012/asdf";
      expect(hooks.getReceiveURL(url, session)).toEqual(
        "foo/bar/012/asdf/xhr?foo=bar"
      );
    });

    it("#onHeartbeat should not send anything", function() {
      hooks.onHeartbeat(socket);
      expect(socket.sendRaw).not.toHaveBeenCalled();
    });

    it("#sendHeartbeat should send an '[]' frame", function() {
      hooks.sendHeartbeat(socket);
      expect(socket.sendRaw).toHaveBeenCalledWith("[]");
      expect(socket.sendRaw.calls.length).toEqual(1);
    });

    it("#onFinished with status 200 should reconnect the socket", function() {
      hooks.onFinished(socket, 200);
      expect(socket.reconnect.calls.length).toEqual(1);
    });

    it("#onFinished with non-200 status should close the socket", function() {
      hooks.onFinished(socket, 500);
      expect(socket.onClose).toHaveBeenCalledWith(
        1006, "Connection interrupted (500)", false
      );
      expect(socket.onClose.calls.length).toEqual(1);
    });
  });
});
