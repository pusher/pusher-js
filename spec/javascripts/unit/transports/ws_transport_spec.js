describe("WSTransport", function() {
  function getTransport(key, options) {
    key = key || "foo";
    options = Pusher.Util.extend({
      secure: false,
      host: "example.com",
      nonsecurePort: 12345,
      securePort: 54321,
    }, options);

    return new Pusher.WSTransport(key, options);
  };

  var _WebSocket;
  var _MozWebSocket;

  beforeEach(function() {
    this.socket = {};
    this.transport = getTransport("foo");
    this.transport.initialize();

    _WebSocket = window.WebSocket;
    _MozWebSocket = window.WebSocket;
    window.WebSocket = jasmine.createSpy("WebSocket").andReturn(this.socket);
    window.MozWebSocket = jasmine.createSpy("WebSocket").andReturn(this.socket);
  });

  afterEach(function() {
    window.WebSocket = _WebSocket;
    window.MozWebSocket = _MozWebSocket;
  });

  it("should expose its name", function() {
    expect(this.transport.name).toEqual("ws");
  });

  it("should not support ping", function() {
    expect(this.transport.supportsPing()).toBe(false);
  });

  it("should be supported in browsers with WebSocket implementation", function() {
    window.WebSocket = {};
    window.MozWebSocket = undefined;

    expect(Pusher.WSTransport.isSupported()).toBe(true);
  });

  it("should be supported in Firefox < 10.0", function() {
    window.WebSocket = undefined;
    window.MozWebSocket = {};

    expect(Pusher.WSTransport.isSupported()).toBe(true);
  });

  it("should not be supported in browsers without WebSocket implementation", function() {
    window.WebSocket = undefined;
    window.MozWebSocket = undefined;

    expect(Pusher.WSTransport.isSupported()).toBe(false);
  });

  describe("when opening connections", function() {
    it("should create a WebSocket with correct URL", function() {
      this.transport.initialize();
      this.transport.connect();
      expect(window.WebSocket)
        .toHaveBeenCalledWith(
          "ws://example.com:12345/app/foo" +
          "?protocol=5&client=js&version=<VERSION>&flash=false"
        );
    });

    it("should create a MozWebSocket when WebSocket is not declared", function() {
      window.WebSocket = undefined;

      this.transport.initialize();
      this.transport.connect();
      expect(window.MozWebSocket)
        .toHaveBeenCalledWith(
          "ws://example.com:12345/app/foo" +
          "?protocol=5&client=js&version=<VERSION>&flash=false"
        );
    });
  });
});
