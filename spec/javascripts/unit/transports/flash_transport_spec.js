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

  var _FlashWebSocket;
  var _Dependencies;

  beforeEach(function() {
    this.socket = {};
    this.timeline = Pusher.Mocks.getTimeline();
    this.timeline.generateUniqueID.andReturn(1);
    this.transport = getTransport("foo", { timeline: this.timeline });

    _Dependencies = Pusher.Dependencies;
    Pusher.Dependencies = Pusher.Mocks.getDependencies();
    Pusher.Dependencies.load.andCallFake(function(name, callback) {
      callback();
    });

    _FlashWebSocket = window.FlashWebSocket;
    window.FlashWebSocket = jasmine.createSpy("FlashWebSocket").andReturn(this.socket);
  });

  afterEach(function() {
    window.FlashWebSocket = _FlashWebSocket;
    Pusher.Dependencies = _Dependencies;
  });

  it("should expose its name", function() {
    expect(this.transport.name).toEqual("f");
  });

  it("should not support ping", function() {
    expect(this.transport.supportsPing()).toBe(false);
  });

  describe("on non-IE browsers", function() {
    // make sure we can mock navigator
    if (!window.navigator.__defineGetter__) {
      return;
    }

    var _navigator, _mimeTypes, _ActiveXObject;

    beforeEach(function() {
      _navigator = window.navigator;
      _mimeTypes = window.navigator.mimeTypes;
      _ActiveXObject = window.ActiveXObject;
    });

    afterEach(function() {
      window.ActiveXObject = _ActiveXObject;
      window.navigator.__defineGetter__("mimeTypes", function() {
        return _mimeTypes;
      });
      window.navigator = _navigator;
    });

    describe("supporting Flash", function() {
      beforeEach(function() {
        window.navigator = {};
        window.navigator.__defineGetter__("mimeTypes", function() {
          return { "application/x-shockwave-flash": {} };
        });
        window.ActiveXObject = undefined;
      });

      it("should be supported", function() {
        expect(Pusher.FlashTransport.isSupported()).toBe(true);

        window.navigator.__defineGetter__("mimeTypes", function() {
          return {};
        });
        expect(Pusher.FlashTransport.isSupported()).toBe(false);
      });
    });

    describe("not supporting Flash", function() {
      beforeEach(function() {
        window.navigator = {};
        window.navigator.__defineGetter__("mimeTypes", function() {
          return {};
        });
      });

      it("should not be supported", function() {
        expect(Pusher.FlashTransport.isSupported()).toBe(false);
      });
    });

    describe("not exposing mimeTypes", function() {
      beforeEach(function() {
        window.navigator = {};
        window.navigator.__defineGetter__("mimeTypes", function() {
          return null;
        });
      });

      it("should not be supported", function() {
        expect(Pusher.FlashTransport.isSupported()).toBe(false);
      });
    });
  });

  describe("on IE", function() {
    var _navigator, _mimeTypes, _ActiveXObject;

    beforeEach(function() {
      _navigator = window.navigator;
      _mimeTypes = window.navigator.mimeTypes;
      _ActiveXObject = window.ActiveXObject;

      // mock navigator if we can, other browsers should pass this test too
      if (window.navigator.__defineGetter__) {
        window.navigator = {};
        window.navigator.__defineGetter__("mimeTypes", function() {
          return {};
        });
      }
    });

    afterEach(function() {
      if (window.navigator.__defineGetter__) {
        window.navigator.__defineGetter__("mimeTypes", function() {
          return _mimeTypes;
        });
        window.navigator = _navigator;
      }
      window.ActiveXObject = _ActiveXObject;
    });

    describe("supporting Flash", function() {
      beforeEach(function() {
        window.ActiveXObject = jasmine.createSpy("ActiveXObject");
      });

      it("should be supported", function() {
        expect(Pusher.FlashTransport.isSupported()).toBe(true);
      });
    });

    describe("not supporting Flash", function() {
      beforeEach(function() {
        window.ActiveXObject = jasmine.createSpy("ActiveXObject");
        window.ActiveXObject.andCallFake(function() {
          throw new Error("Automation server can't create object");
        });
      });

      it("should not be supported", function() {
        expect(Pusher.FlashTransport.isSupported()).toBe(false);
      });
    });
  });

  describe("on initialize", function() {
    it("should load flashfallback and emit an 'initialized' event", function() {
      var onInitialized = jasmine.createSpy("onInitialized");
      var onInitializing = jasmine.createSpy("onInitializing");
      this.transport.bind("initialized", onInitialized);
      this.transport.bind("initializing", onInitializing);

      var onDependencyLoaded = null;
      Pusher.Dependencies.load.andCallFake(function(name, c) {
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

    it("should set the WEB_SOCKET_SWF_LOCATION global", function() {
      Pusher.Dependencies.getRoot.andReturn("http://example.com/1.2.3");
      window.WEB_SOCKET_SWF_LOCATION = null;

      this.transport.initialize();

      expect(window.WEB_SOCKET_SWF_LOCATION)
        .toEqual("http://example.com/1.2.3/WebSocketMain.swf");
    });
  });

  describe("on connect", function() {
    it("should create a FlashWebSocket with correct URL", function() {
      this.transport.initialize();
      this.transport.connect();
      expect(window.FlashWebSocket)
        .toHaveBeenCalledWith(
          "ws://example.com:12345/app/foo" +
          "?protocol=7&client=js&version=<VERSION>&flash=true"
        );
    });
  });
});
