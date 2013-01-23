describe("FlashTransport", function() {
  function getTransport(key, options) {
    key = key || "foo";
    options = Pusher.Util.extend({
      encrypted: false,
      hostUnencrypted: "example.com:12345",
      hostEncrypted: "example.com:54321"
    }, options);

    return new Pusher.FlashTransport("f", 2, key, options);
  }

  var _WebSocket;

  beforeEach(function() {
    this.socket = {};
    this.timeline = Pusher.Mocks.getTimeline();
    this.timeline.generateUniqueID.andReturn(1);
    this.transport = getTransport("foo", { timeline: this.timeline });

    Pusher.Dependencies.loaded.flashfallback = true;

    _WebSocket = window.WebSocket;
    window.WebSocket = jasmine.createSpy("WebSocket").andReturn(this.socket);
  });

  afterEach(function() {
    window.WebSocket = _WebSocket;
  });

  it("should expose its name", function() {
    expect(this.transport.name).toEqual("f");
  });

  it("should not support ping", function() {
    expect(this.transport.supportsPing()).toBe(false);
  });

  it("should be supported only if Flash is present", function() {
    var _navigator = navigator;
    var _mimeTypes = navigator.mimeTypes;

    // workaround for IE to skip navigator tests
    if (navigator.__defineGetter__) {

      // For browsers with navigator object

      navigator = {};

      navigator.__defineGetter__("mimeTypes", function() {
        return { "application/x-shockwave-flash": {} };
      });
      expect(Pusher.FlashTransport.isSupported()).toBe(true);

      expect(Pusher.FlashTransport.isSupported({
        disableFlash: true
      })).toBe(false);

      navigator.__defineGetter__("mimeTypes", function() {
        return {};
      });
      expect(Pusher.FlashTransport.isSupported()).toBe(false);
    }

    // IE compatibility

    var _ActiveXObject = window.ActiveXObject;
    window.ActiveXObject = jasmine.createSpy("ActiveXObject");

    expect(Pusher.FlashTransport.isSupported()).toBe(true);
    expect(window.ActiveXObject)
      .toHaveBeenCalledWith("ShockwaveFlash.ShockwaveFlash");

    expect(Pusher.FlashTransport.isSupported({
      disableFlash: true
    })).toBe(false);

    window.ActiveXObject.andCallFake(function() {
      throw new Error("Automation server can't create object");
    });
    expect(Pusher.FlashTransport.isSupported()).toBe(false);

    window.ActiveXObject = _ActiveXObject;

    // restore navigator for non-IE browsers
    if (navigator.__defineGetter__) {
      navigator.__defineGetter__("mimeTypes", function() {
        return _mimeTypes;
      });
      navigator = _navigator;
    }
  });

  describe("on initialize", function() {
    it("should load flashfallback and emit an 'initialized' event", function() {
      var onInitialized = jasmine.createSpy("onInitialized");
      var onInitializing = jasmine.createSpy("onInitializing");
      this.transport.bind("initialized", onInitialized);
      this.transport.bind("initializing", onInitializing);

      var onDependencyLoaded = null;
      spyOn(Pusher.Dependencies, "load").andCallFake(function(name, c) {
        expect(name).toEqual("flashfallback");
        onDependencyLoaded = c;
      });

      this.transport.initialize();

      expect(Pusher.Dependencies.load).toHaveBeenCalled();
      expect(onInitializing).toHaveBeenCalled();
      expect(onInitialized).not.toHaveBeenCalled();

      onDependencyLoaded();

      expect(onInitialized).toHaveBeenCalled();
    });

    it("should log method call with debug level", function() {
      this.transport.initialize();
      expect(this.timeline.debug).toHaveBeenCalledWith({
        cid: 1,
        method: "initialize"
      });
    });

    it("should log transport name with info level", function() {
      this.transport.initialize();
      expect(this.timeline.info).toHaveBeenCalledWith({
        cid: 1,
        transport: "f"
      });
    });

    it("should log transport name with an 's' suffix when encrypted", function() {
      var transport = getTransport("xxx", {
        timeline: this.timeline,
        encrypted: true
      });
      transport.initialize();

      expect(this.timeline.info).toHaveBeenCalledWith({
        cid: 1,
        transport: "fs"
      });
    });
  });

  describe("on connect", function() {
    it("should create a WebSocket with correct URL", function() {
      this.transport.initialize();
      this.transport.connect();
      expect(window.WebSocket)
        .toHaveBeenCalledWith(
          "ws://example.com:12345/app/foo" +
          "?protocol=6&client=js&version=<VERSION>&flash=true"
        );
    });
  });
});
