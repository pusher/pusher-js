var Mocks = require("../../helpers/mocks");
var Factory = require('utils/factory').default;
var transports = require('transports/transports');
var Util = require('util').default;
var Collections = require('utils/collections');
var WS = require('pusher-websocket-iso-externals-web/ws');

var VERSION = require('defaults').VERSION;

describe("transports", function() {
  describe("WSTransport", function() {
    var _WebSocket = window.WebSocket;
    var _MozWebSocket = window.MozWebSocket;

    afterEach(function() {
      window.WebSocket = _WebSocket;
      window.MozWebSocket = _MozWebSocket;
    });

    it("should generate correct unencrypted URLs", function() {
      var url = transports.WSTransport.hooks.urls.getInitial("foobar", {
        encrypted: false,
        hostUnencrypted: "example.com:123"
      });
      expect(url).toEqual(
        "ws://example.com:123/app/foobar?protocol=7&client=js&version=" + VERSION + "&flash=false"
      );
    });

    it("should generate correct encrypted URLs", function() {
      var url = transports.WSTransport.hooks.urls.getInitial("foobar", {
        encrypted: true,
        hostEncrypted: "example.org:321"
      });
      expect(url).toEqual(
        "wss://example.org:321/app/foobar?protocol=7&client=js&version=" + VERSION + "&flash=false"
      );
    });

    it("should not have a resource file", function() {
      expect(transports.WSTransport.hooks.file).toBe(undefined);
    });

    it("should not expose the URL path generator", function() {
      expect(transports.WSTransport.hooks.urls.getPath).toBe(undefined);
    });

    it("should not handle activity checks", function() {
      expect(transports.WSTransport.hooks.handlesActivityChecks).toBe(false);
    });

    it("should not support ping", function() {
      expect(transports.WSTransport.hooks.supportsPing).toBe(false);
    });

    it("should not have a beforeOpen hook", function() {
      expect(transports.WSTransport.hooks.beforeOpen).toBe(undefined);
    });

    describe("isSupported hook", function() {
      it("should return true if the WebSocket class is present", function() {
        window.WebSocket = {};
        window.MozWebSocket = undefined;

        expect(transports.WSTransport.hooks.isSupported({})).toBe(true);
      });

      it("should return true if the MozWebSocket class is present and WebSocket class is absent", function() {
        window.WebSocket = undefined;
        window.MozWebSocket = {};

        expect(transports.WSTransport.hooks.isSupported({})).toBe(true);
      });

      it("should return false if WebSocket and MozWebSocket classes are absent", function() {
        window.WebSocket = undefined;
        window.MozWebSocket = undefined;

        expect(transports.WSTransport.hooks.isSupported({})).toBe(false);
      });
    });

    describe("getSocket hook", function() {
      it("should return a new WebSocket object, if the class is present", function() {
        window.WebSocket = jasmine.createSpy().andCallFake(function(url) {
          this.url = url;
        });
        window.MozWebSocket = undefined;

        var socket = transports.WSTransport.hooks.getSocket("testurl");
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

        var socket = transports.WSTransport.hooks.getSocket("moztesturl");
        expect(window.MozWebSocket.calls.length).toEqual(1);
        expect(window.MozWebSocket).toHaveBeenCalledWith("moztesturl");
        expect(socket).toEqual(jasmine.any(window.MozWebSocket));
        expect(socket.url).toEqual("moztesturl");
      });
    });
  });

  var XHR_TRANSPORTS = ["XHRStreamingTransport", "XHRPollingTransport"];
  var XDR_TRANSPORTS = ["XDRStreamingTransport", "XDRPollingTransport"];
  var STREAMING_TRANSPORTS = ["XHRStreamingTransport", "XDRStreamingTransport"];
  var POLLING_TRANSPORTS = ["XHRPollingTransport", "XDRPollingTransport"];
  var HTTP_TRANSPORTS = [].concat(XHR_TRANSPORTS, XDR_TRANSPORTS);

  Collections.apply(HTTP_TRANSPORTS, function(transport) {
    describe(transport, function() {
      it("should generate correct unencrypted URLs with default path prefix", function() {
        var url = transports[transport].hooks.urls.getInitial("foobar", {
          encrypted: false,
          hostUnencrypted: "example.com:8080"
        });
        expect(url).toEqual(
          "http://example.com:8080/pusher/app/foobar?protocol=7&client=js&version=" + VERSION
        );
      });

      it("should generate correct unencrypted URLs with custom path prefix", function() {
        var url = transports[transport].hooks.urls.getInitial("foobar", {
          encrypted: false,
          hostUnencrypted: "example.com:8080",
          httpPath: "/a/b/c"
        });
        expect(url).toEqual(
          "http://example.com:8080/a/b/c/app/foobar?protocol=7&client=js&version=" + VERSION
        );
      });

      it("should generate correct encrypted URLs with default path prefix", function() {
        var url = transports[transport].hooks.urls.getInitial("foobar", {
          encrypted: true,
          hostEncrypted: "example.org:4443"
        });
        expect(url).toEqual(
          "https://example.org:4443/pusher/app/foobar?protocol=7&client=js&version=" + VERSION
        );
      });

      it("should generate correct encrypted URLs with custom path prefix", function() {
        var url = transports[transport].hooks.urls.getInitial("foobar", {
          encrypted: true,
          hostEncrypted: "example.org:4443",
          httpPath: "/c/b/a"
        });
        expect(url).toEqual(
          "https://example.org:4443/c/b/a/app/foobar?protocol=7&client=js&version=" + VERSION
        );
      });

      it("should not expose the URL path generator", function() {
        expect(transports[transport].hooks.urls.getPath).toBe(undefined);
      });

      it("should not handle activity checks", function() {
        expect(transports[transport].hooks.handlesActivityChecks).toBe(false);
      });

      it("should support ping", function() {
        expect(transports[transport].hooks.supportsPing).toBe(true);
      });

      it("should not have a beforeOpen hook", function() {
        expect(transports[transport].hooks.beforeOpen).toBe(undefined);
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
          expect(transports[transport].hooks.isSupported({})).toBe(true);
        });

        it("should return false if window.XMLHttpRequest exists, but its instances don't have a withCredentials property", function() {
          window.XMLHttpRequest = jasmine.createSpy().andCallFake(function() {
            this.withCredentials = undefined;
          });
          expect(transports[transport].hooks.isSupported({})).toBe(false);
        });

        it("should return false if window.XMLHttpRequest does not exist", function() {
          window.XMLHttpRequest = undefined;
          expect(transports[transport].hooks.isSupported({})).toBe(false);
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
          spyOn(Util, "getDocument").andReturn({
            location: {
              protocol: "http:"
            }
          });
          expect(transports[transport].hooks.isSupported({ encrypted: false })).toBe(true);
        });

        it("should return true if window.XDomainRequest exists, document protocol is https: and connection is encrypted", function() {
          window.XDomainRequest = function() {};
          spyOn(Util, "getDocument").andReturn({
            location: {
              protocol: "https:"
            }
          });
          expect(transports[transport].hooks.isSupported({ encrypted: true })).toBe(true);
        });

        it("should return false if window.XDomainRequest exists, document protocol is http: and connection is encrypted", function() {
          window.XDomainRequest = function() {};
          spyOn(Util, "getDocument").andReturn({
            location: {
              protocol: "http:"
            }
          });
          expect(transports[transport].hooks.isSupported({ encrypted: true })).toBe(false);
        });

        it("should return false if window.XDomainRequest exists, document protocol is https: and connection is unencrypted", function() {
          window.XDomainRequest = function() {};
          spyOn(Util, "getDocument").andReturn({
            location: {
              protocol: "https:"
            }
          });
          expect(transports[transport].hooks.isSupported({ encrypted: false })).toBe(false);
        });

        it("should return false if window.XDomainRequest does not exist", function() {
          window.XDomainRequest = undefined;
          expect(transports[transport].hooks.isSupported({ encrypted: false })).toBe(false);
          expect(transports[transport].hooks.isSupported({ encrypted: true })).toBe(false);
        });
      });
    });
  });

  Collections.apply(STREAMING_TRANSPORTS, function(transport) {
    describe(transport, function() {
      describe("getSocket hook", function() {
        // FIXME
        xit("should return a new streaming HTTPSocket object", function() {
          spyOn(Pusher.HTTP, "getStreamingSocket").andCallFake(function(url) {
            return "streaming socket mock";
          });

          var socket = transports[transport].hooks.getSocket("streamurl");
          expect(Pusher.HTTP.getStreamingSocket.calls.length).toEqual(1);
          expect(Pusher.HTTP.getStreamingSocket).toHaveBeenCalledWith("streamurl");
          expect(socket).toEqual("streaming socket mock");
        });
      });
    });
  });

  Collections.apply(POLLING_TRANSPORTS, function(transport) {
    describe(transport, function() {
      describe("getSocket hook", function() {
        // FIXME
        xit("should return a new polling HTTPSocket object", function() {
          spyOn(Pusher.HTTP, "getPollingSocket").andCallFake(function(url) {
            return "polling socket mock";
          });

          var socket = transports[transport].hooks.getSocket("streamurl");
          expect(Pusher.HTTP.getPollingSocket.calls.length).toEqual(1);
          expect(Pusher.HTTP.getPollingSocket).toHaveBeenCalledWith("streamurl");
          expect(socket).toEqual("polling socket mock");
        });
      });
    });
  });
});
