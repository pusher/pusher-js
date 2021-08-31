var Pusher = require('core/pusher').default;
var Mocks = require('../../../helpers/mocks');
var Runtime = require('runtime').default;
var Factory = require('core/utils/factory').default;
var DependencyLoader = require('dom/dependency_loader').default;

describe("DependencyLoader", function() {
  var doc;
  var receivers;
  var scriptRequest;
  var onLoaded;
  var loader;

  beforeEach(function() {
    doc = Mocks.getDocument();
    doc.location.protocol = "http:";

    spyOn(Runtime, "getDocument").and.returnValue(doc);
    spyOn(Runtime, "createScriptRequest").and.callFake(function() {
      scriptRequest = Mocks.getScriptRequest();
      return scriptRequest;
    });

    onLoaded = jasmine.createSpy("onLoaded");

    loader = new DependencyLoader({
      cdn_http: "http://example.com",
      cdn_https: "https://example.com",
      version: "6.6.6",
      suffix: "-test",
      receivers: Pusher.ScriptReceivers
    });
  });

  describe("#getRoot", function() {
    it("should return correct URL when using HTTP", function() {
      doc.location.protocol = "http:";
      expect(loader.getRoot()).toEqual(
        "http://example.com/6.6.6"
      );
    });

    it("should return correct URL when using HTTP, but TLS is requested", function() {
      doc.location.protocol = "http:";
      expect(loader.getRoot({ useTLS: true })).toEqual(
        "https://example.com/6.6.6"
      );
    });

    it("should return correct URL when using HTTPS", function() {
      doc.location.protocol = "https:";
      expect(loader.getRoot()).toEqual(
        "https://example.com/6.6.6"
      );
    });

    it("should strip trailing slashes from the CDN url", function() {
      var loader = new DependencyLoader({
        cdn_http: "http://example.com/",
        cdn_https: "https://example.com/",
        version: "6.6.6",
        suffix: "-test",
        receivers: Pusher.ScriptReceivers
      });
      expect(loader.getRoot()).toEqual(
        "http://example.com/6.6.6"
      );
    });
  });

  describe("#getPath", function() {
    it("should return correct URL when using HTTP", function() {
      doc.location.protocol = "http:";
      expect(loader.getPath("something")).toEqual(
        "http://example.com/6.6.6/something-test.js"
      );
    });

    it("should return correct URL when using HTTP, but TLS is requested", function() {
      doc.location.protocol = "http:";
      expect(loader.getPath("something", { useTLS: true })).toEqual(
        "https://example.com/6.6.6/something-test.js"
      );
    });

    it("should return correct URL when using HTTPS", function() {
      doc.location.protocol = "https:";
      expect(loader.getPath("something_else")).toEqual(
        "https://example.com/6.6.6/something_else-test.js"
      );
    });

    it("should strip trailing slashes from the CDN url", function() {
      var loader = new DependencyLoader({
        cdn_http: "http://example.com/",
        cdn_https: "https://example.com/",
        version: "6.6.6",
        suffix: "-test",
        receivers: Pusher.ScriptReceivers
      });
      expect(loader.getPath("something_else")).toEqual(
        "http://example.com/6.6.6/something_else-test.js"
      );
    });
  });

  describe("#load", function() {
    it("should send an non TLS script request when served via http", function() {
      doc.location.protocol = "http:";
      loader.load("resource", {}, onLoaded);
      expect(Runtime.createScriptRequest.calls.count()).toEqual(1);
      expect(Runtime.createScriptRequest).toHaveBeenCalledWith(
        "http://example.com/6.6.6/resource-test.js"
      );
    });

    it("should send a TLS script request when served via https", function() {
      doc.location.protocol = "https:";
      loader.load("resource", {}, onLoaded);
      expect(Runtime.createScriptRequest.calls.count()).toEqual(1);
      expect(Runtime.createScriptRequest).toHaveBeenCalledWith(
        "https://example.com/6.6.6/resource-test.js"
      );
    });

    it("should send a TLS script request when served via http, but passed TLS via options", function() {
      doc.location.protocol = "http:";
      loader.load("resource", { useTLS: true }, onLoaded);
      expect(Runtime.createScriptRequest.calls.count()).toEqual(1);
      expect(Runtime.createScriptRequest).toHaveBeenCalledWith(
        "https://example.com/6.6.6/resource-test.js"
      );
    });

    it("should only send one script request per resource at a time", function() {
      expect(Runtime.createScriptRequest.calls.count()).toEqual(0);

      loader.load("resource", {}, function() {});
      loader.load("resource", {}, function() {});
      loader.load("resource", {}, function() {});
      expect(Runtime.createScriptRequest.calls.count()).toEqual(1);
      expect(Runtime.createScriptRequest).toHaveBeenCalledWith(
        "http://example.com/6.6.6/resource-test.js"
      );

      loader.load("resource2", {}, function() {});
      expect(Runtime.createScriptRequest.calls.count()).toEqual(2);
      expect(Runtime.createScriptRequest).toHaveBeenCalledWith(
        "http://example.com/6.6.6/resource2-test.js"
      );
    });

    it("should register a receiver", function() {
      loader.load("resource", {}, onLoaded);
      var receiver = scriptRequest.send.calls.first().args[0];
      expect(Pusher.ScriptReceivers[receiver.number]).toBe(
        receiver.callback
      );
    });

    it("should call back without an error if the resource loaded successfully", function() {
      loader.load("resource", {}, onLoaded);
      var receiver = scriptRequest.send.calls.first().args[0];

      expect(onLoaded).not.toHaveBeenCalled();
      receiver.callback(null);
      expect(onLoaded).toHaveBeenCalledWith(null, jasmine.any(Function));
    });

    it("should call back with an error if the resource failed to load", function() {
      loader.load("resource", {}, onLoaded);
      var receiver = scriptRequest.send.calls.first().args[0];

      expect(onLoaded).not.toHaveBeenCalled();
      receiver.callback("too bad");
      expect(onLoaded).toHaveBeenCalledWith("too bad", jasmine.any(Function));
    });

    it("should trigger all resource's callbacks", function() {
      var onLoaded2 = jasmine.createSpy();
      var onLoaded3 = jasmine.createSpy();
      loader.load("resource", {}, onLoaded);
      loader.load("resource", {}, onLoaded2);
      var firstScriptRequest = scriptRequest;

      loader.load("resource2", {}, onLoaded3);

      expect(onLoaded.calls.count()).toEqual(0);
      expect(onLoaded2.calls.count()).toEqual(0);
      expect(onLoaded3.calls.count()).toEqual(0);

      var firstReceiver = firstScriptRequest.send.calls.first().args[0];
      firstReceiver.callback(null);

      expect(onLoaded.calls.count()).toEqual(1);
      expect(onLoaded2.calls.count()).toEqual(1);
      expect(onLoaded3.calls.count()).toEqual(0);

      var secondReceiver = scriptRequest.send.calls.first().args[0];
      secondReceiver.callback(null);

      expect(onLoaded.calls.count()).toEqual(1);
      expect(onLoaded2.calls.count()).toEqual(1);
      expect(onLoaded3.calls.count()).toEqual(1);
    });

    describe("after loading the resource", function() {
      var receiver;

      beforeEach(function() {
        loader.load("resource", {}, onLoaded);
        receiver = scriptRequest.send.calls.first().args[0];
        receiver.callback(null);
      });

      it("should remove the receiver", function() {
        expect(Pusher.ScriptReceivers[receiver.number]).toBe(
          undefined
        );
      });

      it("should not clean up the request when called back with true", function() {
        var loadCallback = onLoaded.calls.first().args[1];
        expect(scriptRequest.cleanup).not.toHaveBeenCalled();
        loadCallback(true);
        expect(scriptRequest.cleanup).not.toHaveBeenCalled();
      });

      it("should clean up the request when called back with false", function() {
        var loadCallback = onLoaded.calls.first().args[1];
        expect(scriptRequest.cleanup).not.toHaveBeenCalled();
        loadCallback(false);
        expect(scriptRequest.cleanup.calls.count()).toEqual(1);
      });

      it("should not call old callbacks after loading the script", function() {
        expect(onLoaded.calls.count()).toEqual(1);

        var onLoaded2 = jasmine.createSpy();
        loader.load("resource", {}, onLoaded2);
        var receiver = scriptRequest.send.calls.first().args[0];
        receiver.callback(null);

        expect(onLoaded.calls.count()).toEqual(1);
        expect(onLoaded2.calls.count()).toEqual(1);
      });
    });
  });
});
