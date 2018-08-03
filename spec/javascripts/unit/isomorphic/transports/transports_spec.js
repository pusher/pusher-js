var Mocks = require("mocks");
var Factory = require('core/utils/factory').default;
var Collections = require('core/utils/collections');
var HTTP = require('runtime').default.HTTPFactory;
var Runtime = require('runtime').default;
var VERSION = require('core/defaults').default.VERSION;
var Transports = Runtime.Transports;

describe("Transports", function() {
  describe("ws", function() {
    it("should generate correct non TLS URLs", function() {
      var url = Transports.ws.hooks.urls.getInitial("foobar", {
        useTLS: false,
        hostNonTLS: "example.com:123"
      });
      expect(url).toEqual(
        "ws://example.com:123/app/foobar?protocol=7&client=js&version=" + VERSION + "&flash=false"
      );
    });

    it("should generate correct TLS URLs", function() {
      var url = Transports.ws.hooks.urls.getInitial("foobar", {
        useTLS: true,
        hostTLS: "example.org:321"
      });
      expect(url).toEqual(
        "wss://example.org:321/app/foobar?protocol=7&client=js&version=" + VERSION + "&flash=false"
      );
    });

    it("should generate correct non TLS URLs with custom path prefix", function() {
      var url = Transports.ws.hooks.urls.getInitial("foobar", {
        useTLS: false,
        hostNonTLS: "example.com:123",
        httpPath: "/path"
      });
      expect(url).toEqual(
        "ws://example.com:123/path/app/foobar?protocol=7&client=js&version=" + VERSION + "&flash=false"
      );
    });
 
    it("should generate correct TLS URLs with custom path prefix", function() {
      var url = Transports.ws.hooks.urls.getInitial("foobar", {
        useTLS: true,
        hostTLS: "example.org:321",
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
      it("should return true", function() {
        expect(Transports.ws.hooks.isSupported({})).toBe(true);
      });
    });

    describe("getSocket hook", function() {
      it("should return a new WebSocket object, if the class is present", function() {
        var FakeWebSocket = function(url) {
          this.url = url;
        }
        spyOn(Runtime, 'getWebSocketAPI').andReturn(FakeWebSocket);
        var socket = Transports.ws.hooks.getSocket("testurl");
        expect(Runtime.getWebSocketAPI.calls.length).toEqual(1);
        expect(socket).toEqual(jasmine.any(FakeWebSocket));
        expect(socket.url).toEqual("testurl");
      });
    });
  });

  var XHR_TRANSPORTS = ["xhr_streaming", "xhr_polling"];
  var STREAMING_TRANSPORTS = ["xhr_streaming"];
  var POLLING_TRANSPORTS = ["xhr_polling"];

  Collections.apply(XHR_TRANSPORTS, function(transport) {
    describe(transport, function() {
      it("should generate correct non TLS URLs with default path prefix", function() {
        var url = Transports[transport].hooks.urls.getInitial("foobar", {
          useTLS: false,
          hostNonTLS: "example.com:8080"
        });
        expect(url).toEqual(
          "http://example.com:8080/pusher/app/foobar?protocol=7&client=js&version=" + VERSION
        );
      });

      it("should generate correct non TLS URLs with custom path prefix", function() {
        var url = Transports[transport].hooks.urls.getInitial("foobar", {
          useTLS: false,
          hostNonTLS: "example.com:8080",
          httpPath: "/a/b/c"
        });
        expect(url).toEqual(
          "http://example.com:8080/a/b/c/app/foobar?protocol=7&client=js&version=" + VERSION
        );
      });

      it("should generate correct TLS URLs with default path prefix", function() {
        var url = Transports[transport].hooks.urls.getInitial("foobar", {
          useTLS: true,
          hostTLS: "example.org:4443"
        });
        expect(url).toEqual(
          "https://example.org:4443/pusher/app/foobar?protocol=7&client=js&version=" + VERSION
        );
      });

      it("should generate correct TLS URLs with custom path prefix", function() {
        var url = Transports[transport].hooks.urls.getInitial("foobar", {
          useTLS: true,
          hostTLS: "example.org:4443",
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
      describe("isSupported hook", function() {
        it("should return true", function(){
          expect(Transports[transport].hooks.isSupported({})).toBe(true);
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
