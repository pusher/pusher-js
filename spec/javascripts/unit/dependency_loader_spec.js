describe("DependencyLoader", function() {
  var doc;
  var receivers;
  var scriptRequest;
  var onLoaded;
  var loader;

  beforeEach(function() {
    doc = Pusher.Mocks.getDocument();
    doc.location.protocol = "http:";

    spyOn(Pusher.Util, "getDocument").andReturn(doc);
    spyOn(Pusher, "ScriptRequest").andCallFake(function() {
      scriptRequest = Pusher.Mocks.getScriptRequest();
      return scriptRequest;
    });

    onLoaded = jasmine.createSpy("onLoaded");

    loader = new Pusher.DependencyLoader({
      cdn_http: "http://example.com",
      cdn_https: "https://example.com",
      version: "6.6.6",
      suffix: "-test",
      receivers: Pusher.Integration.ScriptReceivers
    });
  });

  describe("#getRoot", function() {
    it("should return correct URL when using HTTP", function() {
      doc.location.protocol = "http:";
      expect(loader.getRoot()).toEqual(
        "http://example.com/6.6.6"
      );
    });

    it("should return correct URL when using HTTP, but encrypted is requested", function() {
      doc.location.protocol = "http:";
      expect(loader.getRoot({ encrypted: true })).toEqual(
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
      var loader = new Pusher.DependencyLoader({
        cdn_http: "http://example.com/",
        cdn_https: "https://example.com/",
        version: "6.6.6",
        suffix: "-test",
        receivers: Pusher.Integration.ScriptReceivers
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

    it("should return correct URL when using HTTP, but encrypted is requested", function() {
      doc.location.protocol = "http:";
      expect(loader.getPath("something", { encrypted: true })).toEqual(
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
      var loader = new Pusher.DependencyLoader({
        cdn_http: "http://example.com/",
        cdn_https: "https://example.com/",
        version: "6.6.6",
        suffix: "-test",
        receivers: Pusher.Integration.ScriptReceivers
      });
      expect(loader.getPath("something_else")).toEqual(
        "http://example.com/6.6.6/something_else-test.js"
      );
    });
  });

  describe("#load", function() {
    describe("if the script has not been loaded", function() {
      it("should send an unencrypted script request when served via http", function() {
        doc.location.protocol = "http:";
        loader.load("resource", onLoaded);
        expect(Pusher.ScriptRequest.calls.length).toEqual(1);
        expect(Pusher.ScriptRequest).toHaveBeenCalledWith(
          "http://example.com/6.6.6/resource-test.js"
        );
      });

      it("should send an encrypted script request when served via https", function() {
        doc.location.protocol = "https:";
        loader.load("resource", onLoaded);
        expect(Pusher.ScriptRequest.calls.length).toEqual(1);
        expect(Pusher.ScriptRequest).toHaveBeenCalledWith(
          "https://example.com/6.6.6/resource-test.js"
        );
      });

      it("should only send one script request per resource at a time", function() {
        expect(Pusher.ScriptRequest.calls.length).toEqual(0);

        loader.load("resource", function() {});
        loader.load("resource", function() {});
        loader.load("resource", function() {});
        expect(Pusher.ScriptRequest.calls.length).toEqual(1);
        expect(Pusher.ScriptRequest).toHaveBeenCalledWith(
          "http://example.com/6.6.6/resource-test.js"
        );

        loader.load("resource2", function() {});
        expect(Pusher.ScriptRequest.calls.length).toEqual(2);
        expect(Pusher.ScriptRequest).toHaveBeenCalledWith(
          "http://example.com/6.6.6/resource2-test.js"
        );
      });

      it("should register a receiver", function() {
        var receiver = scriptRequest.send.calls[0].args[0];
        expect(Pusher.Integration.ScriptReceivers[receiver.number]).toBe(
          receiver.callback
        );
      });

      it("should call back without an error if the resource loaded successfully", function() {
        loader.load("resource", onLoaded);
        var receiver = scriptRequest.send.calls[0].args[0];

        expect(onLoaded).not.toHaveBeenCalled();
        receiver.callback(null);
        expect(onLoaded).toHaveBeenCalledWith(null);
      });

      it("should call back without an error if the resource failed to load", function() {
        loader.load("resource", onLoaded);
        var receiver = scriptRequest.send.calls[0].args[0];

        expect(onLoaded).not.toHaveBeenCalled();
        receiver.callback("too bad");
        expect(onLoaded).toHaveBeenCalledWith("too bad");
      });

      it("should trigger all resource's callbacks", function() {
        var onLoaded2 = jasmine.createSpy();
        var onLoaded3 = jasmine.createSpy();
        loader.load("resource", onLoaded);
        loader.load("resource", onLoaded2);
        var firstScriptRequest = scriptRequest;

        loader.load("resource2", onLoaded3);

        expect(onLoaded.calls.length).toEqual(0);
        expect(onLoaded2.calls.length).toEqual(0);
        expect(onLoaded3.calls.length).toEqual(0);

        var firstReceiver = firstScriptRequest.send.calls[0].args[0];
        firstReceiver.callback(null);

        expect(onLoaded.calls.length).toEqual(1);
        expect(onLoaded2.calls.length).toEqual(1);
        expect(onLoaded3.calls.length).toEqual(0);

        var secondReceiver = scriptRequest.send.calls[0].args[0];
        secondReceiver.callback(null);

        expect(onLoaded.calls.length).toEqual(1);
        expect(onLoaded2.calls.length).toEqual(1);
        expect(onLoaded3.calls.length).toEqual(1);
      });
    });

    describe("if the script has been loaded", function() {
      beforeEach(function() {
        loader.load("resource", function() {});
        var receiver = scriptRequest.send.calls[0].args[0];
        receiver.callback(null);
      });

      it("should call back immediately", function() {
        loader.load("resource", onLoaded);
        expect(onLoaded).toHaveBeenCalledWith(null);
      });

      it("should remove the receiver", function() {
        var receiver = scriptRequest.send.calls[0].args[0];
        expect(Pusher.Integration.ScriptReceivers[receiver.number]).toBe(
          undefined
        );
      });

      it("should not clean up the request", function() {
        expect(scriptRequest.cleanup).not.toHaveBeenCalled();
      });

      it("should not send a new script request", function() {
        expect(Pusher.ScriptRequest.calls.length).toEqual(1);
        expect(scriptRequest.send.calls.length).toEqual(1);
        loader.load("resource", onLoaded);
        expect(Pusher.ScriptRequest.calls.length).toEqual(1);
        expect(scriptRequest.send.calls.length).toEqual(1);
      });
    });

    describe("if the script failed to load", function() {
      beforeEach(function() {
        loader.load("resource", onLoaded);
        var receiver = scriptRequest.send.calls[0].args[0];
        receiver.callback("fail");
      });

      it("should remove the receiver", function() {
        var receiver = scriptRequest.send.calls[0].args[0];
        expect(Pusher.Integration.ScriptReceivers[receiver.number]).toBe(
          undefined
        );
      });

      it("should clean up the request", function() {
        expect(scriptRequest.cleanup).toHaveBeenCalled();
      });

      it("should try to load the script again", function() {
        expect(Pusher.ScriptRequest.calls.length).toEqual(1);
        loader.load("resource", onLoaded);
        expect(Pusher.ScriptRequest.calls.length).toEqual(2);
        expect(Pusher.ScriptRequest.calls[1].args).toEqual(
          ["http://example.com/6.6.6/resource-test.js"]
        );
      });

      it("should not call old callbacks after loading the script", function() {
        expect(onLoaded.calls.length).toEqual(1);

        var onLoaded2 = jasmine.createSpy();
        loader.load("resource", onLoaded2);
        var receiver = scriptRequest.send.calls[0].args[0];
        receiver.callback(null);

        expect(onLoaded.calls.length).toEqual(1);
        expect(onLoaded2.calls.length).toEqual(1);
      });
    });
  });
});
