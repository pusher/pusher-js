describe("HTTPXDomainRequest", function() {
  var _XDomainRequest = window.XDomainRequest;

  var xdr;
  var request;

  beforeEach(function() {
    window.XDomainRequest = jasmine.createSpy("XDomainRequest");
    window.XDomainRequest.andCallFake(Pusher.Mocks.getXHR);

    spyOn(Pusher.Util, "addWindowListener");
    spyOn(Pusher.Util, "removeWindowListener");

    request = new Pusher.HTTPXDomainRequest("GET", "http://example.com");
    xdr = request.xdr;
  });

  afterEach(function() {
    window.XDomainRequest = _XDomainRequest;
  });

  describe("#start", function() {
    it("should open and send the request", function() {
      request.start("test payload");

      expect(xdr.open).toHaveBeenCalledWith(
        "GET", "http://example.com", true
      );
      expect(xdr.send).toHaveBeenCalledWith("test payload");
    });

    it("should register an unloader", function() {
      request.start("test payload");

      expect(Pusher.Util.addWindowListener).toHaveBeenCalledWith(
        "unload", jasmine.any(Function)
      );
    });

    it("should re-throw the exception raised by XDomainRequest#open", function() {
      xdr.open.andThrow("open exception");
      expect(function() {
        request.start();
      }).toThrow("open exception");
    });

    it("should re-throw the exception raised by XDomainRequest#send", function() {
      xdr.send.andThrow("send exception");
      expect(function() {
        request.start();
      }).toThrow("send exception");
    });
  });

  describe("#close", function() {
    beforeEach(function() {
      request.start();
    });

    it("should abort the request", function() {
      request.close();
      expect(xdr.abort).toHaveBeenCalled();
    });

    it("should remove the ontimeout listener", function() {
      request.close();
      expect(xdr.ontimeout).toBe(null);
    });

    it("should remove the onerror listener", function() {
      request.close();
      expect(xdr.onerror).toBe(null);
    });

    it("should remove the onprogress listener", function() {
      request.close();
      expect(xdr.onprogress).toBe(null);
    });

    it("should remove the onload listener", function() {
      request.close();
      expect(xdr.onload).toBe(null);
    });

    it("should unregister the unloader", function() {
      var unloader = Pusher.Util.addWindowListener.calls[0].args[1];
      request.close();
      expect(Pusher.Util.removeWindowListener).toHaveBeenCalledWith(
        "unload", unloader
      );
    });
  });

  describe("on received data", function() {
    var onChunk;

    beforeEach(function() {
      onChunk = jasmine.createSpy("onChunk");
      request.bind("chunk", onChunk);
      request.start();
    });

    it("should emit the first chunk", function() {
      xdr.responseText = "chunk1\n";
      xdr.onprogress();

      expect(onChunk).toHaveBeenCalledWith({ status: 200, data: "chunk1" });
    });

    it("should emit two chunks received one after another", function() {
      xdr.responseText = "c1\n";
      xdr.onprogress();

      expect(onChunk.calls.length).toEqual(1);
      expect(onChunk).toHaveBeenCalledWith({ status: 200, data: "c1" });

      xdr.responseText = "c1\nc2\n";
      xdr.onprogress();

      expect(onChunk.calls.length).toEqual(2);
      expect(onChunk).toHaveBeenCalledWith({ status: 200, data: "c2" });
    });

    it("should emit all chunks send in one batch", function() {
      xdr.responseText = "c1\nc2\nc3\n";
      xdr.onprogress();

      expect(onChunk.calls.length).toEqual(3);
      expect(onChunk.calls[0].args[0]).toEqual({ status: 200, data: "c1" });
      expect(onChunk.calls[1].args[0]).toEqual({ status: 200, data: "c2" });
      expect(onChunk.calls[2].args[0]).toEqual({ status: 200, data: "c3" });
    });

    it("should not emit an unfinished chunk", function() {
      xdr.responseText = "whatever";
      xdr.onprogress();

      expect(onChunk).not.toHaveBeenCalled();
    });
  });

  describe("on request end", function() {
    beforeEach(function() {
      request.start();
    });

    it("should emit all chunks before the finished event", function() {
      var onChunk = jasmine.createSpy("onChunk").andCallFake(function() {
        expect(onFinished).not.toHaveBeenCalled();
      });
      var onFinished = jasmine.createSpy("onFinished");
      request.bind("finished", onFinished);
      request.bind("chunk", onChunk);

      xdr.responseText = "1\n2\n";
      xdr.onload();

      expect(onChunk.calls[0].args[0]).toEqual({ status: 200, data: "1" });
      expect(onChunk.calls[1].args[0]).toEqual({ status: 200, data: "2" });
    });

    it("should abort the request", function() {
      xdr.responseText = "";
      xdr.onload();
      expect(xdr.abort).toHaveBeenCalled();
    });

    it("should remove the ontimeout listener", function() {
      xdr.responseText = "";
      xdr.onload();
      expect(xdr.ontimeout).toBe(null);
    });

    it("should remove the onerror listener", function() {
      xdr.responseText = "";
      xdr.onload();
      expect(xdr.onerror).toBe(null);
    });

    it("should remove the onprogress listener", function() {
      xdr.responseText = "";
      xdr.onload();
      expect(xdr.onprogress).toBe(null);
    });

    it("should remove the onload listener", function() {
      xdr.responseText = "";
      xdr.onload();
      expect(xdr.onload).toBe(null);
    });

    it("should unregister the unloader", function() {
      var unloader = Pusher.Util.addWindowListener.calls[0].args[1];

      xdr.responseText = "";
      xdr.onload();
      expect(Pusher.Util.removeWindowListener).toHaveBeenCalledWith(
        "unload", unloader
      );
    });
  });

  describe("on timeout", function() {
    beforeEach(function() {
      request.start();
    });

    it("should emit an error", function() {
      var onError = jasmine.createSpy("onError");
      request.bind("error", onError);

      xdr.ontimeout();

      expect(onError).toHaveBeenCalledWith(jasmine.any(Pusher.Errors.RequestTimedOut));
    });

    it("should remove the ontimeout listener", function() {
      xdr.responseText = "";
      xdr.ontimeout();
      expect(xdr.ontimeout).toBe(null);
    });

    it("should remove the onerror listener", function() {
      xdr.responseText = "";
      xdr.ontimeout();
      expect(xdr.onerror).toBe(null);
    });

    it("should remove the onprogress listener", function() {
      xdr.responseText = "";
      xdr.ontimeout();
      expect(xdr.onprogress).toBe(null);
    });

    it("should remove the onload listener", function() {
      xdr.responseText = "";
      xdr.ontimeout();
      expect(xdr.onload).toBe(null);
    });

    it("should unregister the unloader", function() {
      var unloader = Pusher.Util.addWindowListener.calls[0].args[1];

      xdr.responseText = "";
      xdr.ontimeout();
      expect(Pusher.Util.removeWindowListener).toHaveBeenCalledWith(
        "unload", unloader
      );
    });
  });

  describe("on error", function() {
    beforeEach(function() {
      request.start();
    });

    it("should emit the error", function() {
      var onError = jasmine.createSpy("onError");
      request.bind("error", onError);

      xdr.onerror("Test error");

      expect(onError).toHaveBeenCalledWith("Test error");
    });

    it("should remove the ontimeout listener", function() {
      xdr.responseText = "";
      xdr.onerror("error");
      expect(xdr.ontimeout).toBe(null);
    });

    it("should remove the onerror listener", function() {
      xdr.responseText = "";
      xdr.onerror("error");
      expect(xdr.onerror).toBe(null);
    });

    it("should remove the onprogress listener", function() {
      xdr.responseText = "";
      xdr.onerror("error");
      expect(xdr.onprogress).toBe(null);
    });

    it("should remove the onload listener", function() {
      xdr.responseText = "";
      xdr.onerror("error");
      expect(xdr.onload).toBe(null);
    });

    it("should unregister the unloader", function() {
      var unloader = Pusher.Util.addWindowListener.calls[0].args[1];

      xdr.responseText = "";
      xdr.onerror("error");
      expect(Pusher.Util.removeWindowListener).toHaveBeenCalledWith(
        "unload", unloader
      );
    });
  });

  describe("on page unload", function() {
    var unloader;

    beforeEach(function() {
      request.start("test payload");
      unloader = Pusher.Util.addWindowListener.calls[0].args[1];
    });

    it("should abort the request", function() {
      unloader();
      expect(xdr.abort).toHaveBeenCalled();
    });

    it("should remove the ontimeout listener", function() {
      unloader();
      expect(xdr.ontimeout).toBe(null);
    });

    it("should remove the onerror listener", function() {
      unloader();
      expect(xdr.onerror).toBe(null);
    });

    it("should remove the onprogress listener", function() {
      unloader();
      expect(xdr.onprogress).toBe(null);
    });

    it("should remove the onload listener", function() {
      unloader();
      expect(xdr.onload).toBe(null);
    });

    it("should unregister the unloader", function() {
      unloader();
      expect(Pusher.Util.removeWindowListener).toHaveBeenCalledWith(
        "unload", unloader
      );
    });
  });
});
