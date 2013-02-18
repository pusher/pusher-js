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
  }

  var _SockJS;

  beforeEach(function() {
    this.socket = {};
    this.timeline = Pusher.Mocks.getTimeline();
    this.transport = getTransport("foo", { timeline: this.timeline });

    Pusher.Dependencies.loaded.sockjs = true;

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

  describe("on initialize", function() {
    it("should load sockjs and emit an 'initialized' event", function() {
      var onInitialized = jasmine.createSpy("onInitialized");
      var onInitializing = jasmine.createSpy("onInitializing");
      this.transport.bind("initialized", onInitialized);
      this.transport.bind("initializing", onInitializing);

      var onDependencyLoaded = null;
      spyOn(Pusher.Dependencies, "load").andCallFake(function(name, c) {
        expect(name).toEqual("sockjs");
        onDependencyLoaded = c;
      });

      this.transport.initialize();

      expect(Pusher.Dependencies.load).toHaveBeenCalled();
      expect(onInitializing).toHaveBeenCalled();
      expect(onInitialized).not.toHaveBeenCalled();

      onDependencyLoaded();

      expect(onInitialized).toHaveBeenCalled();
    });
  });

  describe("on connect", function() {
    it("should create a SockJS connection", function() {
      this.transport.initialize();
      this.transport.connect();
      expect(window.SockJS)
        .toHaveBeenCalledWith(
          "http://example.com:12345/pusher",
          null,
          { protocols_whitelist: [
              'xdr-streaming', 'xhr-streaming',
              'xdr-polling', 'xhr-polling', 'jsonp-polling'
            ]
          }
        );
    });

    it("should create an encrypted SockJS", function() {
      var transport = new getTransport("bar", {
        encrypted: true,
        timeline: this.timeline
      });

      transport.initialize();
      transport.connect();
      expect(window.SockJS)
        .toHaveBeenCalledWith(
          "https://example.com:54321/pusher",
          null,
          { protocols_whitelist: [
              'xdr-streaming', 'xhr-streaming',
              'xdr-polling', 'xhr-polling', 'jsonp-polling'
            ]
          }
        );
    });

    it("should send path after opening connection", function() {
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
