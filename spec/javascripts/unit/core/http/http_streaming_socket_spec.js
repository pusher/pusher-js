var Mocks = require('mocks');
var HTTPFactory = require('runtime').default.HTTPFactory;

describe("HTTP.getStreamingSocket", function() {
  var hooks;
  var url;
  var socket;

  beforeEach(function() {
    spyOn(HTTPFactory, "createSocket").and.callFake(function(h, u) {
      socket = Mocks.getHTTPSocket();
      hooks = h;
      url = u;
      return socket;
    });
  });

  it("should pass the correct url", function() {
    HTTPFactory.createStreamingSocket("http://example.org/xyz");
    expect(url).toEqual("http://example.org/xyz");
  });

  describe("hooks", function() {
    beforeEach(function() {
      HTTPFactory.createStreamingSocket("http://example.com");
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
      expect(socket.sendRaw.calls.count()).toEqual(1);
    });

    it("#sendHeartbeat should send an '[]' frame", function() {
      hooks.sendHeartbeat(socket);
      expect(socket.sendRaw).toHaveBeenCalledWith("[]");
      expect(socket.sendRaw.calls.count()).toEqual(1);
    });

    it("#onFinished should close the socket", function() {
      hooks.onFinished(socket, 200);
      expect(socket.onClose).toHaveBeenCalledWith(
        1006, "Connection interrupted (200)", false
      );
      expect(socket.onClose.calls.count()).toEqual(1);
    });
  });
});
