describeIntegration("Host/Port Configuration", function() {
  var transport;
  var pusher;

  beforeEach(function() {
    spyOn(Pusher.Network, "isOnline").andReturn(true);
    spyOn(Pusher.Util, "getLocalStorage").andReturn({});
  });

  afterEach(function() {
    pusher.disconnect();
  });

  describe("WebSockets", function() {
    var _WebSocket;

    beforeEach(function() {
      spyOn(Pusher.WSTransport, "isSupported").andReturn(true);
      spyOn(Pusher.FlashTransport, "isSupported").andReturn(false);
      spyOn(Pusher.XDRStreamingTransport, "isSupported").andReturn(false);
      spyOn(Pusher.XHRStreamingTransport, "isSupported").andReturn(false);
      spyOn(Pusher.XDRPollingTransport, "isSupported").andReturn(false);
      spyOn(Pusher.XHRPollingTransport, "isSupported").andReturn(false);
      spyOn(Pusher.SockJSTransport, "isSupported").andReturn(false);

      _WebSocket = window.WebSocket;
      window.WebSocket = jasmine.createSpy("WebSocket").andCallFake(function() {
        return Pusher.Mocks.getTransport();
      });
    });

    afterEach(function() {
      window.WebSocket = _WebSocket;
    });

    it("should connect to ws://ws.pusherapp.com:80 by default", function() {
      pusher = new Pusher("foobar");
      pusher.connect();

      expect(window.WebSocket).toHaveBeenCalledWith(
        "ws://ws.pusherapp.com:80/app/foobar?protocol=7&client=js&version=<VERSION>&flash=false"
      );
    });

    it("should connect to wss://ws.pusherapp.com:443 by default when encrypted", function() {
      pusher = new Pusher("foobar", { encrypted: true });
      pusher.connect();

      expect(window.WebSocket).toHaveBeenCalledWith(
        "wss://ws.pusherapp.com:443/app/foobar?protocol=7&client=js&version=<VERSION>&flash=false"
      );
    });

    it("should connect using wsHost and wsPort when specified in options", function() {
      pusher = new Pusher("foobar", { wsHost: "example.com", wsPort: 1999 });
      pusher.connect();

      expect(window.WebSocket).toHaveBeenCalledWith(
        "ws://example.com:1999/app/foobar?protocol=7&client=js&version=<VERSION>&flash=false"
      );
    });

    it("should connect using wsHost and wssPort when specified in options and encrypted", function() {
      pusher = new Pusher("foobar", { wsHost: "example.org", wssPort: 4444, encrypted: true });
      pusher.connect();

      expect(window.WebSocket).toHaveBeenCalledWith(
        "wss://example.org:4444/app/foobar?protocol=7&client=js&version=<VERSION>&flash=false"
      );
    });
  });

  describe("Flash", function() {
    var _FlashWebSocket;

    beforeEach(function() {
      spyOn(Pusher.WSTransport, "isSupported").andReturn(false);
      spyOn(Pusher.FlashTransport, "isSupported").andReturn(true);
      spyOn(Pusher.XDRStreamingTransport, "isSupported").andReturn(false);
      spyOn(Pusher.XHRStreamingTransport, "isSupported").andReturn(false);
      spyOn(Pusher.SockJSTransport, "isSupported").andReturn(false);

      spyOn(Pusher.Dependencies, "load").andCallFake(function(file, callback) {
        callback();
      });

      _FlashWebSocket = window.WebSocket;
      window.FlashWebSocket = jasmine.createSpy("WebSocket").andCallFake(function() {
        return Pusher.Mocks.getTransport();
      });
    });

    afterEach(function() {
      window.FlashWebSocket = _FlashWebSocket;
    });

    it("should connect to ws://ws.pusherapp.com:80 by default", function() {
      pusher = new Pusher("foobar");
      pusher.connect();

      expect(window.FlashWebSocket).toHaveBeenCalledWith(
        "ws://ws.pusherapp.com:80/app/foobar?protocol=7&client=js&version=<VERSION>&flash=true"
      );
    });

    it("should connect to wss://ws.pusherapp.com:443 by default when encrypted", function() {
      pusher = new Pusher("foobar", { encrypted: true });
      pusher.connect();

      expect(window.FlashWebSocket).toHaveBeenCalledWith(
        "wss://ws.pusherapp.com:443/app/foobar?protocol=7&client=js&version=<VERSION>&flash=true"
      );
    });

    it("should connect using wsHost and wsPort when specified in options", function() {
      pusher = new Pusher("foobar", { wsHost: "example.com", wsPort: 1999 });
      pusher.connect();

      expect(window.FlashWebSocket).toHaveBeenCalledWith(
        "ws://example.com:1999/app/foobar?protocol=7&client=js&version=<VERSION>&flash=true"
      );
    });

    it("should connect using wsHost and wssPort when specified in options and encrypted", function() {
      pusher = new Pusher("foobar", { wsHost: "example.org", wssPort: 4444, encrypted: true });
      pusher.connect();

      expect(window.FlashWebSocket).toHaveBeenCalledWith(
        "wss://example.org:4444/app/foobar?protocol=7&client=js&version=<VERSION>&flash=true"
      );
    });
  });

  describe("SockJS", function() {
    var _SockJS;

    beforeEach(function() {
      spyOn(Pusher.WSTransport, "isSupported").andReturn(false);
      spyOn(Pusher.FlashTransport, "isSupported").andReturn(false);
      spyOn(Pusher.XDRStreamingTransport, "isSupported").andReturn(false);
      spyOn(Pusher.XHRStreamingTransport, "isSupported").andReturn(false);
      spyOn(Pusher.XDRPollingTransport, "isSupported").andReturn(false);
      spyOn(Pusher.XHRPollingTransport, "isSupported").andReturn(false);
      spyOn(Pusher.SockJSTransport, "isSupported").andReturn(true);

      spyOn(Pusher.Dependencies, "load").andCallFake(function(file, callback) {
        callback();
      });

      _SockJS = window.WebSocket;
      window.SockJS = jasmine.createSpy("WebSocket").andCallFake(function() {
        return Pusher.Mocks.getTransport();
      });
    });

    afterEach(function() {
      window.SockJS = _SockJS;
    });

    it("should connect to http://sockjs.pusher.com:80 by default", function() {
      pusher = new Pusher("foobar");
      pusher.connect();

      expect(window.SockJS).toHaveBeenCalledWith(
        "http://sockjs.pusher.com:80/pusher",
        null,
        { js_path: '<CDN_HTTP>/<VERSION>/sockjs<DEPENDENCY_SUFFIX>.js',
          ignore_null_origin: undefined
        }
      );
    });

    it("should connect to https://sockjs.pusher.com:443 by default when encrypted", function() {
      pusher = new Pusher("foobar", { encrypted: true });
      pusher.connect();

      expect(window.SockJS).toHaveBeenCalledWith(
        "https://sockjs.pusher.com:443/pusher",
        null,
        { js_path: '<CDN_HTTPS>/<VERSION>/sockjs<DEPENDENCY_SUFFIX>.js',
          ignore_null_origin: undefined
        }
      );
    });

    it("should connect using httpHost and httpPort when specified in options", function() {
      pusher = new Pusher("foobar", { httpHost: "example.com", httpPort: 1999 });
      pusher.connect();

      expect(window.SockJS).toHaveBeenCalledWith(
        "http://example.com:1999/pusher",
        null,
        { js_path: '<CDN_HTTP>/<VERSION>/sockjs<DEPENDENCY_SUFFIX>.js',
          ignore_null_origin: undefined
        }
      );
    });

    it("should connect using httpHost and httpsPort when specified in options and encrypted", function() {
      pusher = new Pusher("foobar", { httpHost: "example.org", httpsPort: 4444, encrypted: true });
      pusher.connect();

      expect(window.SockJS).toHaveBeenCalledWith(
        "https://example.org:4444/pusher",
        null,
        { js_path: '<CDN_HTTPS>/<VERSION>/sockjs<DEPENDENCY_SUFFIX>.js',
          ignore_null_origin: undefined
        }
      );
    });

    it("should connect using httpPath when specified in options", function() {
      pusher = new Pusher("foobar", { httpPath: "/test" });
      pusher.connect();

      expect(window.SockJS).toHaveBeenCalledWith(
        "http://sockjs.pusher.com:80/test",
        null,
        { js_path: '<CDN_HTTP>/<VERSION>/sockjs<DEPENDENCY_SUFFIX>.js',
          ignore_null_origin: undefined
        }
      );
    });
  });
});
