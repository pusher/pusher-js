var Pusher = require('pusher').default;
var NetInfo  = require('pusher-websocket-iso-externals-web/net_info');
var Mocks = require('../../helpers/mocks');
var version = require('defaults').VERSION;
var Factory  = require('utils/factory').default;

describe("Host/Port Configuration", function() {
  var transport;
  var pusher;
  var Transports;

  beforeEach(function() {
    var Util = require('util').default;

    spyOn(Factory, 'getNetwork').andCallFake(function(){
      var network = new NetInfo();
      network.isOnline = jasmine.createSpy("isOnline")
        .andReturn(true);
    });
    spyOn(Util, "getLocalStorage").andReturn({});
  });

  afterEach(function() {
    pusher.disconnect();
  });

  describe("WebSockets", function() {
    var _WebSocket;

    beforeEach(function() {
      _WebSocket = window.WebSocket;
      // window.WebSocket = jasmine.createSpy("WebSocket").andCallFake(function() {
      //   return Mocks.getTransport();
      // });
      spyOn(Factory, 'newWebSocket').andReturn(Mocks.getTransport());

      Transports = require('transports/transports');

      spyOn(Transports.WSTransport, "isSupported").andReturn(true);
      spyOn(Transports.XDRStreamingTransport, "isSupported").andReturn(false);
      spyOn(Transports.XHRStreamingTransport, "isSupported").andReturn(false);
      spyOn(Transports.XDRPollingTransport, "isSupported").andReturn(false);
      spyOn(Transports.XHRPollingTransport, "isSupported").andReturn(false);
      // spyOn(Transports.SockJSTransport, "isSupported").andReturn(false);
    });

    afterEach(function() {
      window.WebSocket = _WebSocket;
    });

    it("should connect to ws://ws.pusherapp.com:80 by default", function() {
      pusher = new Pusher("foobar");
      pusher.connect();

      expect(Factory.newWebSocket).toHaveBeenCalledWith(
        "ws://ws.pusherapp.com:80/app/foobar?protocol=7&client=js&version="+version+"&flash=false"
      );
    });

    it("should connect to wss://ws.pusherapp.com:443 by default when encrypted", function() {
      pusher = new Pusher("foobar", { encrypted: true });
      pusher.connect();

      expect(Factory.newWebSocket).toHaveBeenCalledWith(
        "wss://ws.pusherapp.com:443/app/foobar?protocol=7&client=js&version="+version+"&flash=false"
      );
    });

    it("should connect using wsHost and wsPort when specified in options", function() {
      pusher = new Pusher("foobar", { wsHost: "example.com", wsPort: 1999 });
      pusher.connect();

      expect(Factory.newWebSocket).toHaveBeenCalledWith(
        "ws://example.com:1999/app/foobar?protocol=7&client=js&version="+version+"&flash=false"
      );
    });

    it("should connect using wsHost and wssPort when specified in options and encrypted", function() {
      pusher = new Pusher("foobar", { wsHost: "example.org", wssPort: 4444, encrypted: true });
      pusher.connect();

      expect(Factory.newWebSocket).toHaveBeenCalledWith(
        "wss://example.org:4444/app/foobar?protocol=7&client=js&version="+version+"&flash=false"
      );
    });
  });

  // TODO change to XHR
  xdescribe("SockJS", function() {
    var _SockJS;

    beforeEach(function() {
      spyOn(Transports.WSTransport, "isSupported").andReturn(false);
      spyOn(Transports.XDRStreamingTransport, "isSupported").andReturn(false);
      spyOn(Transports.XHRStreamingTransport, "isSupported").andReturn(false);
      spyOn(Transports.XDRPollingTransport, "isSupported").andReturn(false);
      spyOn(Transports.XHRPollingTransport, "isSupported").andReturn(false);
      spyOn(Transports.SockJSTransport, "isSupported").andReturn(true);

      _SockJS = window.WebSocket;
      window.SockJS = jasmine.createSpy("WebSocket").andCallFake(function() {
        return Mocks.getTransport();
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
