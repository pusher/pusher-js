var Mocks = require("mocks");
var Factory = require('core/utils/factory').default;
var Transports = require('transports/transports').default;
var Collections = require('core/utils/collections');
var HTTP = require('runtime').default.HTTPFactory;
var Runtime = require('runtime').default;
var VERSION = require('core/defaults').default.VERSION;
var Dependencies = require('dom/dependencies').Dependencies;

describe("Transports", function() {
  describe("ws", function() {
    var _WebSocket = window.WebSocket;
    var _MozWebSocket = window.MozWebSocket;

    afterEach(function() {
      window.WebSocket = _WebSocket;
      window.MozWebSocket = _MozWebSocket;
    });

    it("should generate correct unencrypted URLs", function() {
      var url = Transports.ws.hooks.urls.getInitial("foobar", {
        encrypted: false,
        hostUnencrypted: "example.com:123"
      });
      expect(url).toEqual(
        "ws://example.com:123/app/foobar?protocol=7&client=js&version=" + VERSION + "&flash=false"
      );
    });

    it("should generate correct encrypted URLs", function() {
      var url = Transports.ws.hooks.urls.getInitial("foobar", {
        encrypted: true,
        hostEncrypted: "example.org:321"
      });
      expect(url).toEqual(
        "wss://example.org:321/app/foobar?protocol=7&client=js&version=" + VERSION + "&flash=false"
      );
    });

    it("should generate correct unencrypted URLs with custom path prefix", function() {
      var url = Transports.ws.hooks.urls.getInitial("foobar", {
        encrypted: false,
        hostUnencrypted: "example.com:123",
        httpPath: "/path"
      });
      expect(url).toEqual(
        "ws://example.com:123/path/app/foobar?protocol=7&client=js&version=" + VERSION + "&flash=false"
      );
    });
 
    it("should generate correct encrypted URLs with custom path prefix", function() {
      var url = Transports.ws.hooks.urls.getInitial("foobar", {
        encrypted: true,
        hostEncrypted: "example.org:321",
        httpPath: "/path"
      });
      expect(url).toEqual(
        "wss://example.org:321/path/app/foobar?protocol=7&client=js&version=" + VERSION + "&flash=false"
      );
    });

    it("should not have a resource file", function() {
      expect(Transports.ws.hooks.file).toBe(undefined);
    });

    it("should not expose the URL path generator", function() {
      expect(Transports.ws.hooks.urls.getPath).toBe(undefined);
    });

    it("should not handle activity checks", function() {
      expect(Transports.ws.hooks.handlesActivityChecks).toBe(false);
    });

    it("should not support ping", function() {
      expect(Transports.ws.hooks.supportsPing).toBe(false);
    });

    it("should not have a beforeOpen hook", function() {
      expect(Transports.ws.hooks.beforeOpen).toBe(undefined);
    });

    describe("isSupported hook", function() {
      it("should return true if the WebSocket class is present", function() {
        window.WebSocket = {};
        window.MozWebSocket = undefined;

        expect(Transports.ws.hooks.isSupported({})).toBe(true);
      });

      it("should return true if the MozWebSocket class is present and WebSocket class is absent", function() {
        window.WebSocket = undefined;
        window.MozWebSocket = {};

        expect(Transports.ws.hooks.isSupported({})).toBe(true);
      });

      it("should return false if WebSocket and MozWebSocket classes are absent", function() {
        window.WebSocket = undefined;
        window.MozWebSocket = undefined;

        expect(Transports.ws.hooks.isSupported({})).toBe(false);
      });
    });

    describe("getSocket hook", function() {
      it("should return a new WebSocket object, if the class is present", function() {
        window.WebSocket = jasmine.createSpy().andCallFake(function(url) {
          this.url = url;
        });
        window.MozWebSocket = undefined;

        var socket = Transports.ws.hooks.getSocket("testurl");
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

        var socket = Transports.ws.hooks.getSocket("moztesturl");
        expect(window.MozWebSocket.calls.length).toEqual(1);
        expect(window.MozWebSocket).toHaveBeenCalledWith("moztesturl");
        expect(socket).toEqual(jasmine.any(window.MozWebSocket));
        expect(socket.url).toEqual("moztesturl");
      });
    });
  });

  describe("SockJSTransport", function() {
    var _SockJS = window.SockJS;

    afterEach(function() {
      window.SockJS = _SockJS;
    });

    it("should have a 'sockjs' resource file", function() {
      expect(Transports.sockjs.hooks.file).toEqual("sockjs");
    });

    it("should generate correct unencrypted URLs", function() {
      var url = Transports.sockjs.hooks.urls.getInitial("foobar", {
        encrypted: false,
        hostUnencrypted: "example.com:111"
      });
      expect(url).toEqual("http://example.com:111/pusher");
    });

    it("should generate correct encrypted URLs", function() {
      var url = Transports.sockjs.hooks.urls.getInitial("foobar", {
        encrypted: true,
        hostEncrypted: "example.com:222"
      });
      expect(url).toEqual("https://example.com:222/pusher");
    });

    it("should generate correct paths", function() {
      var path = Transports.sockjs.hooks.urls.getPath("asdf", {});
      expect(path).toEqual("/app/asdf?protocol=7&client=js&version="+VERSION);
    });

    it("should handle activity checks", function() {
      expect(Transports.sockjs.hooks.handlesActivityChecks).toBe(true);
    });

    it("should not support ping", function() {
      expect(Transports.sockjs.hooks.supportsPing).toBe(false);
    });

    describe("beforeOpen hook", function() {
      it("should send the path over the socket", function() {
        // SockJS objects have WebSocket-compatible interface
        var socket = Mocks.getWebSocket();
        Transports.sockjs.hooks.beforeOpen(socket, "test/path");

        expect(socket.send.calls.length).toEqual(1);
        var pathMessage = JSON.parse(socket.send.calls[0].args[0]);
        expect(pathMessage).toEqual({ path: "test/path" });
      });
    });

    describe("isSupported hook", function() {
      it("should always return true", function() {
        expect(Transports.sockjs.hooks.isSupported({})).toBe(true);
      });
    });

    describe("getSocket hook", function() {
      beforeEach(function() {
        Dependencies.load = jasmine.createSpy("load");
        Dependencies.getRoot = jasmine.createSpy("getRoot");
        Dependencies.getPath = jasmine.createSpy("getPath");
        Dependencies.getPath.andCallFake(function(file, options) {
          return (options.encrypted ? "https" : "http") + "://host/" + file;
        });
      });

      it("should pass ignoreNullOrigin to the SockJS constructor", function() {
        window.SockJS = jasmine.createSpy();

        var socket = Transports.sockjs.hooks.getSocket(
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

        var socket = Transports.sockjs.hooks.getSocket(
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

        var socket = Transports.sockjs.hooks.getSocket(
          "sock_test", { encrypted: false }
        );
        expect(window.SockJS.calls.length).toEqual(1);
        expect(socket).toEqual(jasmine.any(window.SockJS));
        expect(socket.url).toEqual("sock_test");
      });
    });
  });

  var XHR_TRANSPORTS = ["xhr_streaming", "xhr_polling"];
  var XDR_TRANSPORTS = ["xdr_streaming", "xdr_polling"];
  var STREAMING_TRANSPORTS = ["xhr_streaming", "xdr_streaming"];
  var POLLING_TRANSPORTS = ["xhr_polling", "xdr_polling"];
  var HTTP_TRANSPORTS = [].concat(XHR_TRANSPORTS, XDR_TRANSPORTS);

  Collections.apply(HTTP_TRANSPORTS, function(transport) {
    describe(transport, function() {
      it("should generate correct unencrypted URLs with default path prefix", function() {
        var url = Transports[transport].hooks.urls.getInitial("foobar", {
          encrypted: false,
          hostUnencrypted: "example.com:8080"
        });
        expect(url).toEqual(
          "http://example.com:8080/pusher/app/foobar?protocol=7&client=js&version=" + VERSION
        );
      });

      it("should generate correct unencrypted URLs with custom path prefix", function() {
        var url = Transports[transport].hooks.urls.getInitial("foobar", {
          encrypted: false,
          hostUnencrypted: "example.com:8080",
          httpPath: "/a/b/c"
        });
        expect(url).toEqual(
          "http://example.com:8080/a/b/c/app/foobar?protocol=7&client=js&version=" + VERSION
        );
      });

      it("should generate correct encrypted URLs with default path prefix", function() {
        var url = Transports[transport].hooks.urls.getInitial("foobar", {
          encrypted: true,
          hostEncrypted: "example.org:4443"
        });
        expect(url).toEqual(
          "https://example.org:4443/pusher/app/foobar?protocol=7&client=js&version=" + VERSION
        );
      });

      it("should generate correct encrypted URLs with custom path prefix", function() {
        var url = Transports[transport].hooks.urls.getInitial("foobar", {
          encrypted: true,
          hostEncrypted: "example.org:4443",
          httpPath: "/c/b/a"
        });
        expect(url).toEqual(
          "https://example.org:4443/c/b/a/app/foobar?protocol=7&client=js&version=" + VERSION
        );
      });

      it("should not expose the URL path generator", function() {
        expect(Transports[transport].hooks.urls.getPath).toBe(undefined);
      });

      it("should not handle activity checks", function() {
        expect(Transports[transport].hooks.handlesActivityChecks).toBe(false);
      });

      it("should support ping", function() {
        expect(Transports[transport].hooks.supportsPing).toBe(true);
      });

      it("should not have a beforeOpen hook", function() {
        expect(Transports[transport].hooks.beforeOpen).toBe(undefined);
      });
    });
  });

  Collections.apply(XHR_TRANSPORTS, function(transport) {
    describe(transport, function() {
      var _XMLHttpRequest = window.XMLHttpRequest;

      afterEach(function() {
        window.XMLHttpRequest = _XMLHttpRequest;
      });

      describe("isSupported hook", function() {
        it("should return true if window.XMLHttpRequest exists and its instances have a withCredentials property", function() {
          window.XMLHttpRequest = jasmine.createSpy().andCallFake(function() {
            this.withCredentials = false;
          });
          expect(Transports[transport].hooks.isSupported({})).toBe(true);
        });

        it("should return false if window.XMLHttpRequest exists, but its instances don't have a withCredentials property", function() {
          window.XMLHttpRequest = jasmine.createSpy().andCallFake(function() {
            this.withCredentials = undefined;
          });
          expect(Transports[transport].hooks.isSupported({})).toBe(false);
        });

        it("should return false if window.XMLHttpRequest does not exist", function() {
          window.XMLHttpRequest = undefined;
          expect(Transports[transport].hooks.isSupported({})).toBe(false);
        });
      });
    });
  });

  Collections.apply(XDR_TRANSPORTS, function(transport) {
    describe(transport, function() {
      var _XDomainRequest = window.XDomainRequest;

      afterEach(function() {
        window.XDomainRequest = _XDomainRequest;
      });

      describe("isSupported hook", function() {
        it("should return true if window.XDomainRequest exists, document protocol is http: and connection is unencrypted", function() {
          window.XDomainRequest = function() {};
          spyOn(Runtime, "getDocument").andReturn({
            location: {
              protocol: "http:"
            }
          });
          expect(Transports[transport].hooks.isSupported({ encrypted: false })).toBe(true);
        });

        it("should return true if window.XDomainRequest exists, document protocol is https: and connection is encrypted", function() {
          window.XDomainRequest = function() {};
          spyOn(Runtime, "getDocument").andReturn({
            location: {
              protocol: "https:"
            }
          });
          expect(Transports[transport].hooks.isSupported({ encrypted: true })).toBe(true);
        });

        it("should return false if window.XDomainRequest exists, document protocol is http: and connection is encrypted", function() {
          window.XDomainRequest = function() {};
          spyOn(Runtime, "getDocument").andReturn({
            location: {
              protocol: "http:"
            }
          });
          expect(Transports[transport].hooks.isSupported({ encrypted: true })).toBe(false);
        });

        it("should return false if window.XDomainRequest exists, document protocol is https: and connection is unencrypted", function() {
          window.XDomainRequest = function() {};
          spyOn(Runtime, "getDocument").andReturn({
            location: {
              protocol: "https:"
            }
          });
          expect(Transports[transport].hooks.isSupported({ encrypted: false })).toBe(false);
        });

        it("should return false if window.XDomainRequest does not exist", function() {
          window.XDomainRequest = undefined;
          expect(Transports[transport].hooks.isSupported({ encrypted: false })).toBe(false);
          expect(Transports[transport].hooks.isSupported({ encrypted: true })).toBe(false);
        });
      });
    });
  });

  Collections.apply(STREAMING_TRANSPORTS, function(transport) {
    describe(transport, function() {
      describe("getSocket hook", function() {
        it("should return a new streaming HTTPSocket object", function() {
          spyOn(HTTP, "createStreamingSocket").andCallFake(function(url) {
            return "streaming socket mock";
          });

          var socket = Transports[transport].hooks.getSocket("streamurl");
          expect(HTTP.createStreamingSocket.calls.length).toEqual(1);
          expect(HTTP.createStreamingSocket).toHaveBeenCalledWith("streamurl");
          expect(socket).toEqual("streaming socket mock");
        });
      });
    });
  });

  Collections.apply(POLLING_TRANSPORTS, function(transport) {
    describe(transport, function() {
      describe("getSocket hook", function() {
        it("should return a new polling HTTPSocket object", function() {
          spyOn(HTTP, "createPollingSocket").andCallFake(function(url) {
            return "polling socket mock";
          });

          var socket = Transports[transport].hooks.getSocket("streamurl");
          expect(HTTP.createPollingSocket.calls.length).toEqual(1);
          expect(HTTP.createPollingSocket).toHaveBeenCalledWith("streamurl");
          expect(socket).toEqual("polling socket mock");
        });
      });
    });
  });
});
