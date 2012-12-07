describe("SockJSTransport", function() {
  function getTransport(key, options) {
    key = key || "foo";
    options = Pusher.Util.extend({
      encrypted: false,
      host: "example.com",
      unencryptedPort: 12345,
      encryptedPort: 54321
    }, options);

    return new Pusher.SockJSTransport(key, options);
  };

  var _SockJS;

  beforeEach(function() {
    this.socket = {};
    this.transport = getTransport("foo");

    Pusher.Dependencies.loaded["sockjs"] = true;

    _SockJS = window.SockJS;
    window.SockJS = jasmine.createSpy("SockJS").andReturn(this.socket);
  });

  afterEach(function() {
    window.SockJS = _SockJS;
  });

  it("should expose its name", function() {
    expect(this.transport.name).toEqual("sockjs");
  });

  it("should always be supported", function() {
    expect(Pusher.SockJSTransport.isSupported()).toBe(true);
  });

  it("should support ping", function() {
    expect(this.transport.supportsPing()).toBe(true);
  });

  describe("when initializing", function() {
    it("should load sockjs dependency and emit appropriate events", function() {
      var initializedCallback = jasmine.createSpy("initializedCallback");
      var initializingCallback = jasmine.createSpy("initializingCallback");
      this.transport.bind("initialized", initializedCallback);
      this.transport.bind("initializing", initializingCallback);

      var dependencyCallback = null;
      spyOn(Pusher.Dependencies, "load").andCallFake(function(name, c) {
        expect(name).toEqual("sockjs");
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
    it("should create a SockJS connection with correct URL", function() {
      this.transport.initialize();
      this.transport.connect();
      expect(window.SockJS)
        .toHaveBeenCalledWith("http://example.com:12345/pusher");
    });

    it("should create an encrypted SockJS connection with correct URL", function() {
      var transport = new getTransport("bar", { encrypted: true });

      transport.initialize();
      transport.connect();
      expect(window.SockJS)
        .toHaveBeenCalledWith("https://example.com:54321/pusher");
    });

    it("should send path immediately after opening connection", function() {
      var openCallback = jasmine.createSpy("openCallback");
      this.transport.bind("open", openCallback);

      this.transport.initialize();
      this.transport.connect();

      this.socket.send = jasmine.createSpy("send");
      this.socket.onopen();

      expect(openCallback).toHaveBeenCalled();
      expect(this.socket.send).toHaveBeenCalledWith(JSON.stringify({
        path: "/app/foo"
      }));
    });
  });
});
