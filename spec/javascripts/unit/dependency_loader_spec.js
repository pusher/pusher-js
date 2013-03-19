describe("DependencyLoader", function() {
  var document, head, script;
  var onLoaded;
  var loader;

  beforeEach(function() {
    head = Pusher.Mocks.getDocumentElement();
    script = Pusher.Mocks.getDocumentElement();

    document = Pusher.Mocks.getDocument();
    document.getElementsByTagName.andReturn([head]);
    document.createElement.andReturn(script);

    spyOn(Pusher.Util, "getDocument").andReturn(document);

    onLoaded = jasmine.createSpy("onLoaded");

    loader = new Pusher.DependencyLoader({
      cdn_http: "http://example.com",
      cdn_https: "https://example.com",
      version: "6.6.6",
      suffix: "-test"
    });
  });

  describe("#getPath", function() {
    it("should return correct path when using HTTP", function() {
      document.location.protocol = "http:";
      expect(loader.getPath("something"))
        .toEqual("http://example.com/6.6.6/something-test.js");
    });

    it("should return correct path when using HTTP, but encrypted is requested", function() {
      document.location.protocol = "http:";
      expect(loader.getPath("something", { encrypted: true }))
        .toEqual("https://example.com/6.6.6/something-test.js");
    });

    it("should return correct path when using HTTPS", function() {
      document.location.protocol = "https:";
      expect(loader.getPath("something_else"))
        .toEqual("https://example.com/6.6.6/something_else-test.js");
    });
  });

  it("should create a head script tag for the resource", function() {
    loader.load("resource", onLoaded);

    expect(document.getElementsByTagName.calls.length).toEqual(1);
    expect(document.getElementsByTagName).toHaveBeenCalledWith("head");
    expect(document.createElement.calls.length).toEqual(1);
    expect(document.createElement).toHaveBeenCalledWith("script");

    expect(script.setAttribute).toHaveBeenCalledWith("type", "text/javascript");
    expect(script.setAttribute).toHaveBeenCalledWith("async", true);
    expect(script.setAttribute).toHaveBeenCalledWith(
      "src", "http://example.com/6.6.6/resource-test.js"
    );

    expect(head.appendChild.calls.length).toEqual(1);
    expect(head.appendChild).toHaveBeenCalledWith(script);
  });

  it("should use https CDN when served from https", function() {
    document.location.protocol = "https:";
    loader.load("something", onLoaded);

    expect(script.setAttribute).toHaveBeenCalledWith(
      "src", "https://example.com/6.6.6/something-test.js"
    );
  });

  it("should call back after the resource has been loaded", function() {
    loader.load("resource", onLoaded);

    expect(script.addEventListener.calls.length).toEqual(1);
    expect(script.addEventListener).toHaveBeenCalledWith(
      "load", jasmine.any(Function), false
    );

    expect(onLoaded).not.toHaveBeenCalled();
    script.addEventListener.calls[0].args[1]();
    expect(onLoaded).not.toHaveBeenCalled();

    waitsFor(function() {
      return onLoaded.calls.length == 1;
    }, "load callback to get called", 100);
  });

  it("should strip trailing slashes from the CDN url", function() {
    loader = new Pusher.DependencyLoader({
      cdn_http: "http://example.com/",
      cdn_https: "https://example.com/",
      version: "6.6.6",
      suffix: "-test"
    });
    loader.load("resource", onLoaded);
    expect(script.setAttribute).toHaveBeenCalledWith(
      "src", "http://example.com/6.6.6/resource-test.js"
    );
  });

  describe("on IE < 9", function() {
    beforeEach(function() {
      document.addEventListener = undefined;
      script.addEventListener = undefined;
      script.attachEvent = jasmine.createSpy("attachEvent");
    });

    it("should call back after the script ends up 'loaded' state", function() {
      loader.load("resource", onLoaded);

      expect(script.attachEvent.calls.length).toEqual(1);
      expect(script.attachEvent).toHaveBeenCalledWith(
        "onreadystatechange", jasmine.any(Function)
      );

      expect(onLoaded).not.toHaveBeenCalled();
      script.readyState = "loaded";
      script.attachEvent.calls[0].args[1]();
      waitsFor(function() {
        return onLoaded.calls.length == 1;
      }, "load callback to get called", 100);
    });

    it("should call back after the script ends up 'complete' state", function() {
      loader.load("resource", onLoaded);

      expect(onLoaded).not.toHaveBeenCalled();
      script.readyState = "complete";
      script.attachEvent.calls[0].args[1]();
      waitsFor(function() {
        return onLoaded.calls.length == 1;
      }, "load callback to get called", 100);
    });
  });

  describe("on multiple load requests", function() {
    var onLoadedSecond;

    beforeEach(function() {
      onLoadedSecond = jasmine.createSpy("onLoadedSecond");
    });

    describe("concurrently", function() {
      describe("for the same resource", function() {
        it("should create only one script tag", function() {
          loader.load("resource", onLoaded);
          loader.load("resource", onLoadedSecond);

          expect(document.getElementsByTagName.calls.length).toEqual(1);
          expect(document.createElement.calls.length).toEqual(1);
          expect(head.appendChild.calls.length).toEqual(1);
        });

        it("should call both callbacks after resource has been loaded", function() {
          loader.load("resource", onLoaded);
          loader.load("resource", onLoadedSecond);

          expect(onLoaded).not.toHaveBeenCalled();
          expect(onLoadedSecond).not.toHaveBeenCalled();
          script.addEventListener.calls[0].args[1]();

          waitsFor(function() {
            return onLoaded.calls.length == 1;
          }, "load callback to get called", 100);
          runs(function() {
            expect(onLoadedSecond.calls.length).toEqual(1);
          });
        });
      });

      describe("for different resources", function() {
        var secondScript;

        beforeEach(function() {
          secondScript = Pusher.Mocks.getDocumentElement();

          var scripts = [script, secondScript];
          document.createElement.andCallFake(function() {
            return scripts.shift();
          });
        });

        it("should create two script tags", function() {
          loader.load("resource", onLoaded);
          loader.load("second", onLoadedSecond);

          expect(document.createElement.calls.length).toEqual(2);

          expect(script.setAttribute).toHaveBeenCalledWith(
            "src", "http://example.com/6.6.6/resource-test.js"
          );
          expect(secondScript.setAttribute).toHaveBeenCalledWith(
            "src", "http://example.com/6.6.6/second-test.js"
          );

          expect(head.appendChild.calls.length).toEqual(2);
        });

        it("should call back for each loaded resource", function() {
          loader.load("resource", onLoaded);
          loader.load("second", onLoadedSecond);

          expect(onLoaded).not.toHaveBeenCalled();
          expect(onLoadedSecond).not.toHaveBeenCalled();
          secondScript.addEventListener.calls[0].args[1]();

          waitsFor(function() {
            return onLoadedSecond.calls.length == 1;
          }, "first load callback to get called", 100);
          runs(function() {
            expect(onLoaded).not.toHaveBeenCalled();
            script.addEventListener.calls[0].args[1]();
            expect(onLoaded).not.toHaveBeenCalled();
          });
          waitsFor(function() {
            return onLoaded.calls.length == 1;
          }, "second load callback to get called", 100);
        });
      });
    });

    describe("subsequently for the same resource", function() {
      beforeEach(function() {
        loader.load("resource", onLoaded);
        script.addEventListener.calls[0].args[1]();

        waitsFor(function() {
          return onLoaded.calls.length == 1;
        }, "load callback to get called", 100);
      });

      it("should not load the resource again", function() {
        runs(function() {
          loader.load("resource", onLoadedSecond);

          expect(document.createElement.calls.length).toEqual(1);
          expect(head.appendChild.calls.length).toEqual(1);
          expect(onLoadedSecond).toHaveBeenCalled();
        });
      });

      it("should call back immediately", function() {
        runs(function() {
          loader.load("resource", onLoadedSecond);
          expect(onLoadedSecond).toHaveBeenCalled();
        });
      });
    });
  });
});
