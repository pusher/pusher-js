describe("Transports", function() {
  var _Dependencies = Pusher.Dependencies;

  beforeEach(function() {
    Pusher.Dependencies = Pusher.Mocks.getDependencies();
  });

  afterEach(function() {
    Pusher.Dependencies = _Dependencies;
  });

  describe("WSTransport", function() {
    var _WebSocket = window.WebSocket;
    var _MozWebSocket = window.MozWebSocket;

    afterEach(function() {
      window.WebSocket = _WebSocket;
      window.MozWebSocket = _MozWebSocket;
    });

    it("should generate correct unencrypted URLs", function() {
      var url = Pusher.WSTransport.hooks.urls.getInitial("foobar", {
        encrypted: false,
        hostUnencrypted: "example.com:123"
      });
      expect(url).toEqual(
        "ws://example.com:123/app/foobar?protocol=7&client=js&version=<VERSION>&flash=false"
      );
    });

    it("should generate correct encrypted URLs", function() {
      var url = Pusher.WSTransport.hooks.urls.getInitial("foobar", {
        encrypted: true,
        hostEncrypted: "example.org:321"
      });
      expect(url).toEqual(
        "wss://example.org:321/app/foobar?protocol=7&client=js&version=<VERSION>&flash=false"
      );
    });

    it("should not have a resource file", function() {
      expect(Pusher.WSTransport.hooks.file).toBe(undefined);
    });

    it("should not expose the URL path generator", function() {
      expect(Pusher.WSTransport.hooks.urls.getPath).toBe(undefined);
    });

    it("should not handle activity checks", function() {
      expect(Pusher.WSTransport.hooks.handlesActivityChecks).toBe(false);
    });

    it("should not support ping", function() {
      expect(Pusher.WSTransport.hooks.supportsPing).toBe(false);
    });

    it("should not have a beforeInitialize hook", function() {
      expect(Pusher.WSTransport.hooks.beforeInitialize).toBe(undefined);
    });

    it("should not have a beforeOpen hook", function() {
      expect(Pusher.WSTransport.hooks.beforeOpen).toBe(undefined);
    });

    describe("isSupported hook", function() {
      it("should return true if the WebSocket class is present", function() {
        window.WebSocket = {};
        window.MozWebSocket = undefined;

        expect(Pusher.WSTransport.hooks.isSupported({})).toBe(true);
      });

      it("should return true if the MozWebSocket class is present and WebSocket class is absent", function() {
        window.WebSocket = undefined;
        window.MozWebSocket = {};

        expect(Pusher.WSTransport.hooks.isSupported({})).toBe(true);
      });

      it("should return false if WebSocket and MozWebSocket classes are absent", function() {
        window.WebSocket = undefined;
        window.MozWebSocket = undefined;

        expect(Pusher.WSTransport.hooks.isSupported({})).toBe(false);
      });
    });

    describe("getSocket hook", function() {
      it("should return a new WebSocket object, if the class is present", function() {
        window.WebSocket = jasmine.createSpy().andCallFake(function(url) {
          this.url = url;
        });
        window.MozWebSocket = undefined;

        var socket = Pusher.WSTransport.hooks.getSocket("testurl");
        expect(window.WebSocket.calls.length).toEqual(1);
        expect(window.WebSocket).toHaveBeenCalledWith("testurl");
        expect(socket).toEqual(jasmine.any(window.WebSocket));
        expect(socket.url).toEqual("testurl");
      });

      it("should return a new MozWebSocket object, if the class is present and WebSocket class is absent", function() {
        window.WebSocket = undefined;
        window.MozWebSocket = jasmine.createSpy().andCallFake(function(url) {
          this.url = url;
        });

        var socket = Pusher.WSTransport.hooks.getSocket("moztesturl");
        expect(window.MozWebSocket.calls.length).toEqual(1);
        expect(window.MozWebSocket).toHaveBeenCalledWith("moztesturl");
        expect(socket).toEqual(jasmine.any(window.MozWebSocket));
        expect(socket.url).toEqual("moztesturl");
      });
    });
  });

  describe("FlashTransport", function() {
    var _FlashWebSocket = window.FlashWebSocket;

    afterEach(function() {
      window.FlashWebSocket = _FlashWebSocket;
    });

    it("should have a 'flashfallback' resource file", function() {
      expect(Pusher.FlashTransport.hooks.file).toEqual("flashfallback");
    });

    it("should generate correct unencrypted URLs", function() {
      var url = Pusher.FlashTransport.hooks.urls.getInitial("foobar", {
        encrypted: false,
        hostUnencrypted: "example.com:4444"
      });
      expect(url).toEqual(
        "ws://example.com:4444/app/foobar?protocol=7&client=js&version=<VERSION>&flash=true"
      );
    });

    it("should generate correct encrypted URLs", function() {
      var url = Pusher.FlashTransport.hooks.urls.getInitial("foobar", {
        encrypted: true,
        hostEncrypted: "example.com:4321"
      });
      expect(url).toEqual(
        "wss://example.com:4321/app/foobar?protocol=7&client=js&version=<VERSION>&flash=true"
      );
    });

    it("should not expose the URL path generator", function() {
      expect(Pusher.FlashTransport.hooks.urls.getPath).toBe(undefined);
    });

    it("should not handle activity checks", function() {
      expect(Pusher.FlashTransport.hooks.handlesActivityChecks).toBe(false);
    });

    it("should not support ping", function() {
      expect(Pusher.FlashTransport.hooks.supportsPing).toBe(false);
    });

    it("should not have a beforeOpen hook", function() {
      expect(Pusher.FlashTransport.hooks.beforeOpen).toBe(undefined);
    });

    describe("beforeInitialize hook", function() {
      var _WEB_SOCKET_SWF_LOCATION = window.WEB_SOCKET_SWF_LOCATION;
      var _WEB_SOCKET_SUPPRESS_CROSS_DOMAIN_SWF_ERROR = window.WEB_SOCKET_SUPPRESS_CROSS_DOMAIN_SWF_ERROR;

      afterEach(function() {
        window.WEB_SOCKET_SWF_LOCATION = _WEB_SOCKET_SWF_LOCATION;
        window.WEB_SOCKET_SUPPRESS_CROSS_DOMAIN_SWF_ERROR = _WEB_SOCKET_SUPPRESS_CROSS_DOMAIN_SWF_ERROR;
      });

      it("should set window.WEB_SOCKET_SUPPRESS_CROSS_DOMAIN_SWF_ERROR to true if it's undefined", function() {
        window.WEB_SOCKET_SUPPRESS_CROSS_DOMAIN_SWF_ERROR = undefined;
        Pusher.FlashTransport.hooks.beforeInitialize();
        expect(window.WEB_SOCKET_SUPPRESS_CROSS_DOMAIN_SWF_ERROR).toBe(true);
      });

      it("should not set window.WEB_SOCKET_SUPPRESS_CROSS_DOMAIN_SWF_ERROR if it's defined", function() {
        window.WEB_SOCKET_SUPPRESS_CROSS_DOMAIN_SWF_ERROR = 'whatever';
        Pusher.FlashTransport.hooks.beforeInitialize();
        expect(window.WEB_SOCKET_SUPPRESS_CROSS_DOMAIN_SWF_ERROR).toBe('whatever');
      });

      it("should set window.WEB_SOCKET_SWF_LOCATION", function() {
        Pusher.Dependencies.getRoot.andReturn("http://example.com/1.2.3");
        Pusher.FlashTransport.hooks.beforeInitialize();
        expect(window.WEB_SOCKET_SWF_LOCATION).toEqual(
          "http://example.com/1.2.3/WebSocketMain.swf"
        );
      });
    });

    describe("isSupported hook", function() {
      var _ActiveXObject = window.ActiveXObject;

      afterEach(function() {
        window.ActiveXObject = _ActiveXObject;
      });

      describe("on non-IE browsers", function() {
        beforeEach(function() {
          window.ActiveXObject = undefined;
          spyOn(Pusher.Util, "getNavigator");
        });

        it("should be supported, if application/x-shockwave-flash is in mime types", function() {
          Pusher.Util.getNavigator.andReturn({
            mimeTypes: {
              "application/x-shockwave-flash": {}
            }
          });
          expect(Pusher.FlashTransport.isSupported({})).toBe(true);
        });

        it("should not be supported if application/x-shockwave-flash is not in mime types", function() {
          Pusher.Util.getNavigator.andReturn({
            mimeTypes: {
              "whatever": {}
            }
          });
          expect(Pusher.FlashTransport.isSupported({})).toBe(false);
        });

        it("should not be supported if mime types are not available", function() {
          Pusher.Util.getNavigator.andReturn({});
          expect(Pusher.FlashTransport.isSupported({})).toBe(false);
        });

        it("should not be supported if navigator is not available", function() {
          Pusher.Util.getNavigator.andReturn(undefined);
          expect(Pusher.FlashTransport.isSupported({})).toBe(false);
        });
      });

      describe("on IE", function() {
        beforeEach(function() {
          window.ActiveXObject = jasmine.createSpy("ActiveXObject");
          spyOn(Pusher.Util, "getNavigator").andReturn({});
        });

        it("should be supported if it's possible to instantiate ShockwaveFlash.ShockwaveFlash ActiveXObject", function() {
          expect(Pusher.FlashTransport.isSupported({})).toBe(true);
        });

        it("should not be supported if instantiating ShockwaveFlash.ShockwaveFlash ActiveXObject throws an error", function() {
          window.ActiveXObject.andCallFake(function() {
            throw new Error("Automation server can't create object");
          });
          expect(Pusher.FlashTransport.isSupported({})).toBe(false);
        });
      });
    });

    describe("getSocket hook", function() {
      it("should return a new FlashWebSocket object", function() {
        window.FlashWebSocket = jasmine.createSpy().andCallFake(function(url) {
          this.url = url;
        });

        var socket = Pusher.FlashTransport.hooks.getSocket("flashtest");
        expect(window.FlashWebSocket.calls.length).toEqual(1);
        expect(window.FlashWebSocket).toHaveBeenCalledWith("flashtest");
        expect(socket).toEqual(jasmine.any(window.FlashWebSocket));
        expect(socket.url).toEqual("flashtest");
      });
    });
  });

  describe("SockJSTransport", function() {
    var _SockJS = window.SockJS;

    afterEach(function() {
      window.SockJS = _SockJS;
    });

    it("should have a 'sockjs' resource file", function() {
      expect(Pusher.SockJSTransport.hooks.file).toEqual("sockjs");
    });

    it("should generate correct unencrypted URLs", function() {
      var url = Pusher.SockJSTransport.hooks.urls.getInitial("foobar", {
        encrypted: false,
        hostUnencrypted: "example.com:111"
      });
      expect(url).toEqual("http://example.com:111/pusher");
    });

    it("should generate correct encrypted URLs", function() {
      var url = Pusher.SockJSTransport.hooks.urls.getInitial("foobar", {
        encrypted: true,
        hostEncrypted: "example.com:222"
      });
      expect(url).toEqual("https://example.com:222/pusher");
    });

    it("should generate correct paths", function() {
      var path = Pusher.SockJSTransport.hooks.urls.getPath("asdf", {});
      expect(path).toEqual("/app/asdf?protocol=7&client=js&version=<VERSION>");
    });

    it("should handle activity checks", function() {
      expect(Pusher.SockJSTransport.hooks.handlesActivityChecks).toBe(true);
    });

    it("should not support ping", function() {
      expect(Pusher.SockJSTransport.hooks.supportsPing).toBe(false);
    });

    it("should not have a beforeInitialize hook", function() {
      expect(Pusher.WSTransport.hooks.beforeInitialize).toBe(undefined);
    });

    describe("beforeOpen hook", function() {
      it("should send the path over the socket", function() {
        // SockJS objects have WebSocket-compatible interface
        var socket = Pusher.Mocks.getWebSocket();
        Pusher.SockJSTransport.hooks.beforeOpen(socket, "test/path");

        expect(socket.send.calls.length).toEqual(1);
        var pathMessage = JSON.parse(socket.send.calls[0].args[0]);
        expect(pathMessage).toEqual({ path: "test/path" });
      });
    });

    describe("isSupported hook", function() {
      it("should always return true", function() {
        expect(Pusher.SockJSTransport.hooks.isSupported({})).toBe(true);
      });
    });

    describe("getSocket hook", function() {
      beforeEach(function() {
        Pusher.Dependencies = Pusher.Mocks.getDependencies();
        Pusher.Dependencies.getPath.andCallFake(function(file, options) {
          return (options.encrypted ? "https" : "http") + "://host/" + file;
        });
      });

      it("should pass ignoreNullOrigin to the SockJS constructor", function() {
        window.SockJS = jasmine.createSpy();

        var socket = Pusher.SockJSTransport.hooks.getSocket(
          "url", { encrypted: false, ignoreNullOrigin: true }
        );
        expect(window.SockJS).toHaveBeenCalledWith(
          "url",
          null,
          { js_path: "http://host/sockjs", ignore_null_origin: true }
        );
      });

      it("should generate a correct JS path", function() {
        window.SockJS = jasmine.createSpy();

        var socket = Pusher.SockJSTransport.hooks.getSocket(
          "url", { encrypted: true }
        );
        expect(window.SockJS).toHaveBeenCalledWith(
          "url", null, { js_path: "https://host/sockjs" }
        );
      });

      it("should return a new SockJS object", function() {
        window.SockJS = jasmine.createSpy().andCallFake(function(url) {
          this.url = url;
        });

        var socket = Pusher.SockJSTransport.hooks.getSocket(
          "sock_test", { encrypted: false }
        );
        expect(window.SockJS.calls.length).toEqual(1);
        expect(socket).toEqual(jasmine.any(window.SockJS));
        expect(socket.url).toEqual("sock_test");
      });
    });
  });

  var XHR_TRANSPORTS = ["XHRStreamingTransport", "XHRPollingTransport"];
  var XDR_TRANSPORTS = ["XDRStreamingTransport", "XDRPollingTransport"];
  var STREAMING_TRANSPORTS = ["XHRStreamingTransport", "XDRStreamingTransport"];
  var POLLING_TRANSPORTS = ["XHRPollingTransport", "XDRPollingTransport"];
  var HTTP_TRANSPORTS = [].concat(XHR_TRANSPORTS, XDR_TRANSPORTS);

  Pusher.Util.apply(HTTP_TRANSPORTS, function(transport) {
    describe(transport, function() {
      it("should generate correct unencrypted URLs with default path prefix", function() {
        var url = Pusher[transport].hooks.urls.getInitial("foobar", {
          encrypted: false,
          hostUnencrypted: "example.com:8080"
        });
        expect(url).toEqual(
          "http://example.com:8080/pusher/app/foobar?protocol=7&client=js&version=<VERSION>"
        );
      });

      it("should generate correct unencrypted URLs with custom path prefix", function() {
        var url = Pusher[transport].hooks.urls.getInitial("foobar", {
          encrypted: false,
          hostUnencrypted: "example.com:8080",
          httpPath: "/a/b/c"
        });
        expect(url).toEqual(
          "http://example.com:8080/a/b/c/app/foobar?protocol=7&client=js&version=<VERSION>"
        );
      });

      it("should generate correct encrypted URLs with default path prefix", function() {
        var url = Pusher[transport].hooks.urls.getInitial("foobar", {
          encrypted: true,
          hostEncrypted: "example.org:4443"
        });
        expect(url).toEqual(
          "https://example.org:4443/pusher/app/foobar?protocol=7&client=js&version=<VERSION>"
        );
      });

      it("should generate correct encrypted URLs with custom path prefix", function() {
        var url = Pusher[transport].hooks.urls.getInitial("foobar", {
          encrypted: true,
          hostEncrypted: "example.org:4443",
          httpPath: "/c/b/a"
        });
        expect(url).toEqual(
          "https://example.org:4443/c/b/a/app/foobar?protocol=7&client=js&version=<VERSION>"
        );
      });

      it("should not expose the URL path generator", function() {
        expect(Pusher[transport].hooks.urls.getPath).toBe(undefined);
      });

      it("should not handle activity checks", function() {
        expect(Pusher[transport].hooks.handlesActivityChecks).toBe(false);
      });

      it("should support ping", function() {
        expect(Pusher[transport].hooks.supportsPing).toBe(true);
      });

      it("should not have a beforeInitialize hook", function() {
        expect(Pusher.WSTransport.hooks.beforeInitialize).toBe(undefined);
      });

      it("should not have a beforeOpen hook", function() {
        expect(Pusher[transport].hooks.beforeOpen).toBe(undefined);
      });
    });
  });

  Pusher.Util.apply(XHR_TRANSPORTS, function(transport) {
    describe(transport, function() {
      var _XMLHttpRequest = window.XMLHttpRequest;

      afterEach(function() {
        window.XMLHttpRequest = _XMLHttpRequest;
      });

      it("should have a 'xhr' resource file", function() {
        expect(Pusher[transport].hooks.file).toEqual("xhr");
      });

      describe("isSupported hook", function() {
        it("should return true if window.XMLHttpRequest exists and its instances have a withCredentials property", function() {
          window.XMLHttpRequest = jasmine.createSpy().andCallFake(function() {
            this.withCredentials = false;
          });
          expect(Pusher[transport].hooks.isSupported({})).toBe(true);
        });

        it("should return false if window.XMLHttpRequest exists, but its instances don't have a withCredentials property", function() {
          window.XMLHttpRequest = jasmine.createSpy().andCallFake(function() {
            this.withCredentials = undefined;
          });
          expect(Pusher[transport].hooks.isSupported({})).toBe(false);
        });

        it("should return false if window.XMLHttpRequest does not exist", function() {
          window.XMLHttpRequest = undefined;
          expect(Pusher[transport].hooks.isSupported({})).toBe(false);
        });
      });
    });
  });

  Pusher.Util.apply(XDR_TRANSPORTS, function(transport) {
    describe(transport, function() {
      var _XDomainRequest = window.XDomainRequest;

      afterEach(function() {
        window.XDomainRequest = _XDomainRequest;
      });

      it("should have a 'xhr' resource file", function() {
        expect(Pusher[transport].hooks.file).toEqual("xdr");
      });

      describe("isSupported hook", function() {
        it("should return true if window.XDomainRequest exists, document protocol is http: and connection is unencrypted", function() {
          window.XDomainRequest = function() {};
          spyOn(Pusher.Util, "getDocument").andReturn({
            location: {
              protocol: "http:"
            }
          });
          expect(Pusher[transport].hooks.isSupported({ encrypted: false })).toBe(true);
        });

        it("should return true if window.XDomainRequest exists, document protocol is https: and connection is encrypted", function() {
          window.XDomainRequest = function() {};
          spyOn(Pusher.Util, "getDocument").andReturn({
            location: {
              protocol: "https:"
            }
          });
          expect(Pusher[transport].hooks.isSupported({ encrypted: true })).toBe(true);
        });

        it("should return false if window.XDomainRequest exists, document protocol is http: and connection is encrypted", function() {
          window.XDomainRequest = function() {};
          spyOn(Pusher.Util, "getDocument").andReturn({
            location: {
              protocol: "http:"
            }
          });
          expect(Pusher[transport].hooks.isSupported({ encrypted: true })).toBe(false);
        });

        it("should return false if window.XDomainRequest exists, document protocol is https: and connection is unencrypted", function() {
          window.XDomainRequest = function() {};
          spyOn(Pusher.Util, "getDocument").andReturn({
            location: {
              protocol: "https:"
            }
          });
          expect(Pusher[transport].hooks.isSupported({ encrypted: false })).toBe(false);
        });

        it("should return false if window.XDomainRequest does not exist", function() {
          window.XDomainRequest = undefined;
          expect(Pusher[transport].hooks.isSupported({ encrypted: false })).toBe(false);
          expect(Pusher[transport].hooks.isSupported({ encrypted: true })).toBe(false);
        });
      });
    });
  });

  Pusher.Util.apply(STREAMING_TRANSPORTS, function(transport) {
    describe(transport, function() {
      describe("getSocket hook", function() {
        it("should return a new streaming HTTPSocket object", function() {
          spyOn(Pusher.HTTP, "getStreamingSocket").andCallFake(function(url) {
            return "streaming socket mock";
          });

          var socket = Pusher[transport].hooks.getSocket("streamurl");
          expect(Pusher.HTTP.getStreamingSocket.calls.length).toEqual(1);
          expect(Pusher.HTTP.getStreamingSocket).toHaveBeenCalledWith("streamurl");
          expect(socket).toEqual("streaming socket mock");
        });
      });
    });
  });

  Pusher.Util.apply(POLLING_TRANSPORTS, function(transport) {
    describe(transport, function() {
      describe("getSocket hook", function() {
        it("should return a new polling HTTPSocket object", function() {
          spyOn(Pusher.HTTP, "getPollingSocket").andCallFake(function(url) {
            return "polling socket mock";
          });

          var socket = Pusher[transport].hooks.getSocket("streamurl");
          expect(Pusher.HTTP.getPollingSocket.calls.length).toEqual(1);
          expect(Pusher.HTTP.getPollingSocket).toHaveBeenCalledWith("streamurl");
          expect(socket).toEqual("polling socket mock");
        });
      });
    });
  });
});
