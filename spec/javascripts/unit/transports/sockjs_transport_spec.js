describe("SockJSTransport", function() {
  function getTransport(key, options) {
    key = key || "foo";
    options = Pusher.Util.extend({
      encrypted: false,
      hostUnencrypted: "example.com:12345",
      hostEncrypted: "example.com:54321"
    }, options);

    return new Pusher.SockJSTransport("test", 1, key, options);
  }

  var _SockJS;
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

    _SockJS = window.SockJS;
    window.SockJS = jasmine.createSpy("SockJS").andReturn(this.socket);
  });

  afterEach(function() {
    window.SockJS = _SockJS;
    Pusher.Dependencies = _Dependencies;
  });

  it("should expose its name", function() {
    expect(this.transport.name).toEqual("test");
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
      Pusher.Dependencies.load.andCallFake(function(name, c) {
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
        transport: "test"
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
        transport: "tests"
      });
    });
  });

  describe("on connect", function() {
    beforeEach(function() {
      Pusher.Dependencies.getPath.andCallFake(function(_, options){
        if (options && options.encrypted) {
          return "https://example.com/6.6.6/sockjs.js";
        } else {
          return "http://example.com/6.6.6/sockjs.js";
        }
      });
    });

    it("should create a SockJS connection", function() {
      this.transport.initialize();
      this.transport.connect();
      expect(window.SockJS)
        .toHaveBeenCalledWith(
          "http://example.com:12345/pusher",
          null,
          { js_path: "http://example.com/6.6.6/sockjs.js" }
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
          { js_path: "https://example.com/6.6.6/sockjs.js" }
        );
    });

    it("should pass 'ignore_null_origin' option to SockJS constructor", function() {
      var transport = new getTransport("bar", {
        encrypted: true,
        timeline: this.timeline,
        ignoreNullOrigin: true
      });

      transport.initialize();
      transport.connect();
      expect(window.SockJS)
        .toHaveBeenCalledWith(
          "https://example.com:54321/pusher",
          null,
          { js_path: "https://example.com/6.6.6/sockjs.js",
            ignore_null_origin: true
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
        path: "/app/foo?protocol=7&client=js&version=<VERSION>"
      }));
    });
  });
});
