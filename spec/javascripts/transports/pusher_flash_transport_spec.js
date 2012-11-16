describe("PusherFlashTransport", function() {
  function getTransport(key, options) {
    key = key || "foo";
    options = Pusher.Util.extend({
      secure: false,
      host: "example.com",
      nonsecurePort: 12345,
      securePort: 54321,
    }, options);

    return new PusherFlashTransport(key, options);
  }

  beforeEach(function() {
    this.socket = {};
    this.transport = getTransport("foo");
    spyOn(window, "WebSocket").andReturn(this.socket);

    Pusher.Dependencies.loaded["flashfallback"] = true;
  });

  it("should expose its name", function() {
    expect(this.transport.name).toEqual("flash");
  });

  it("should be supported only if Flash is present", function() {
    var navigator = window.navigator;

    window.navigator = {
      mimeTypes: { "application/x-shockwave-flash": {} },
    };
    expect(PusherFlashTransport.isSupported()).toBe(true);

    window.navigator = {
      mimeTypes: {},
    };
    expect(PusherFlashTransport.isSupported()).toBe(false);

    window.navigator = navigator;
  });

  describe("when initializing", function() {
    it("should load flashfallback dependency and then emit 'initialized'", function() {
      var initializedCallback = jasmine.createSpy("initializedCallback");
      this.transport.bind("initialized", initializedCallback);

      var dependencyCallback = null;
      spyOn(Pusher.Dependencies, "load").andCallFake(function(name, c) {
        expect(name).toEqual("flashfallback");
        dependencyCallback = c;
      });

      this.transport.initialize();

      expect(Pusher.Dependencies.load).toHaveBeenCalled();
      expect(initializedCallback).not.toHaveBeenCalled();

      dependencyCallback();

      expect(initializedCallback).toHaveBeenCalled();
    });
  });

  describe("when opening connections", function() {
    it("should pass correct query string", function() {
      var transport = getTransport("foo", { secure: false });

      transport.initialize();
      transport.connect();
      expect(window.WebSocket)
        .toHaveBeenCalledWith(
          "ws://example.com:12345/app/foo" +
          "?protocol=5&client=js&flash=true&version=<VERSION>"
        );
    });
  });
});
