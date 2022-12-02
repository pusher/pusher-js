var Runtime = require('runtime').default;
var Dependencies = require('dom/dependencies').Dependencies;
var Mocks = require('mocks');
var NetInfo  = require('net_info').NetInfo;
var Pusher = require('core/pusher').default;
var Defaults = require('core/defaults').default;
var version = Defaults.VERSION;
var cdn_http = Defaults.cdn_http;
var cdn_https = Defaults.cdn_https;
var dependency_suffix = Defaults.dependency_suffix;

describe("Host/Port Configuration", function() {

  var transport;
  var pusher;
  var Transports;

  beforeEach(function() {
    jasmine.clock().uninstall();
    jasmine.clock().install();

    spyOn(Runtime, 'getNetwork').and.callFake(function(){
      var network = new NetInfo();
      network.isOnline = jasmine.createSpy("isOnline")
        .and.returnValue(true);
      return network;
    });
    spyOn(Runtime, "getLocalStorage").and.returnValue({});
    Transports = Runtime.Transports;
  });

  afterEach(function() {
    pusher.disconnect();
    jasmine.clock().uninstall();
  });

  describe("SockJS", function() {
    var _SockJS;

    beforeEach(function() {
      spyOn(Transports.ws, "isSupported").and.returnValue(false);
      spyOn(Transports.xdr_streaming, "isSupported").and.returnValue(false);
      spyOn(Transports.xhr_streaming, "isSupported").and.returnValue(false);
      spyOn(Transports.xdr_polling, "isSupported").and.returnValue(false);
      spyOn(Transports.xhr_polling, "isSupported").and.returnValue(false);
      spyOn(Transports.sockjs, "isSupported").and.returnValue(true);

      spyOn(Dependencies, "load").and.callFake(function(file, callback) {
        callback();
      });

      _SockJS = window.WebSocket;
      window.SockJS = jasmine.createSpy("WebSocket").and.callFake(function() {
        return Mocks.getTransport();
      });
    });

    afterEach(function() {
      window.SockJS = _SockJS;
    });

    it("should connect to https://sockjs-<cluster>.pusher.com:443 by default", function() {
      pusher = new Pusher("foobar", {cluster: "mt1"});
      pusher.connect();

      expect(window.SockJS).toHaveBeenCalledWith(
        "https://sockjs-mt1.pusher.com:443/pusher",
        null,
        { js_path: cdn_https + '/' + version + '/sockjs'+dependency_suffix+'.js',
          ignore_null_origin: undefined
        }
      );
    });

    it("should connect to http://sockjs-<cluster>.pusher.com:80 by default when forceTLS disabled", function() {
      pusher = new Pusher("foobar", { cluster: "mt1", forceTLS: false });
      pusher.connect();

      expect(window.SockJS).toHaveBeenCalledWith(
        "http://sockjs-mt1.pusher.com:80/pusher",
        null,
        { js_path: cdn_http+'/'+version +'/sockjs'+dependency_suffix+'.js',
          ignore_null_origin: undefined
        }
      );
    });

    it("should connect using httpHost and httpsPort when specified in options", function() {
      pusher = new Pusher("foobar", { cluster: "mt1", httpHost: "example.com", httpsPort: 1999 });
      pusher.connect();

      expect(window.SockJS).toHaveBeenCalledWith(
        "https://example.com:1999/pusher",
        null,
        { js_path: cdn_https + '/' + version + '/sockjs'+dependency_suffix+'.js',
          ignore_null_origin: undefined
        }
      );
    });

    it("should connect using httpHost and httpPort when specified in options and forceTLS disabled", function() {
      pusher = new Pusher("foobar", { cluster: "mt1", httpHost: "example.org", httpPort: 4444, forceTLS: false });
      pusher.connect();

      expect(window.SockJS).toHaveBeenCalledWith(
        "http://example.org:4444/pusher",
        null,
        { js_path: cdn_http+'/'+version +'/sockjs'+dependency_suffix+'.js',
          ignore_null_origin: undefined
        }
      );
    });

    it("should connect using httpPath when specified in options", function() {
      pusher = new Pusher("foobar", { cluster: "mt1", httpPath: "/test" });
      pusher.connect();

      expect(window.SockJS).toHaveBeenCalledWith(
        "https://sockjs-mt1.pusher.com:443/test",
        null,
        { js_path: cdn_https + '/' + version + '/sockjs'+dependency_suffix+'.js',
          ignore_null_origin: undefined
        }
      );
    });
  });
});
