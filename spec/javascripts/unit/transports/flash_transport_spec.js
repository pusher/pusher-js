describe("FlashTransport", function() {
  function getTransport(key, options) {
    key = key || "foo";
    options = Pusher.Util.extend({
      encrypted: false,
      host: "example.com",
      unencryptedPort: 12345,
      encryptedPort: 54321
    }, options);

    return new Pusher.FlashTransport(key, options);
  };

  var _WebSocket;

  beforeEach(function() {
    this.socket = {};
    this.transport = getTransport("foo");

    Pusher.Dependencies.loaded["flashfallback"] = true;

    _WebSocket = window.WebSocket;
    window.WebSocket = jasmine.createSpy("WebSocket").andReturn(this.socket);
  });

  afterEach(function() {
    window.WebSocket = _WebSocket;
  });

  it("should expose its name", function() {
    expect(this.transport.name).toEqual("flash");
  });

  it("should not support ping", function() {
    expect(this.transport.supportsPing()).toBe(false);
  });

  it("should be supported only if Flash is present", function() {
    // workaround for IE to skip this test
    if (navigator.__defineGetter__) {
      var _navigator = navigator;
      var _mimeTypes = navigator.mimeTypes;

      navigator = {};

      navigator.__defineGetter__("mimeTypes", function() {
        return { "application/x-shockwave-flash": {} };
      });
      expect(Pusher.FlashTransport.isSupported()).toBe(true);

      navigator.__defineGetter__("mimeTypes", function() {
        return {};
      });
      expect(Pusher.FlashTransport.isSupported()).toBe(false);

      navigator.__defineGetter__("mimeTypes", function() {
        return _mimeTypes;
      });

      navigator = _navigator;
    }
  });

  describe("when initializing", function() {
    it("should load flashfallback dependency and emit appropriate events", function() {
      var initializedCallback = jasmine.createSpy("initializedCallback");
      var initializingCallback = jasmine.createSpy("initializingCallback");
      this.transport.bind("initialized", initializedCallback);
      this.transport.bind("initializing", initializingCallback);

      var dependencyCallback = null;
      spyOn(Pusher.Dependencies, "load").andCallFake(function(name, c) {
        expect(name).toEqual("flashfallback");
        dependencyCallback = c;
      });

      this.transport.initialize();

      expect(Pusher.Dependencies.load).toHaveBeenCalled();
      expect(initializingCallback).toHaveBeenCalled();
      expect(initializedCallback).not.toHaveBeenCalled();

      dependencyCallback();

      expect(initializedCallback).toHaveBeenCalled();
    });
  });

  describe("when opening connections", function() {
    it("should create a WebSocket with correct URL", function() {
      this.transport.initialize();
      this.transport.connect();
      expect(window.WebSocket)
        .toHaveBeenCalledWith(
          "ws://example.com:12345/app/foo" +
          "?protocol=5&client=js&version=<VERSION>&flash=true"
        );
    });
  });
});
