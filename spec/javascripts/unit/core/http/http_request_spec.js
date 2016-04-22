var Mocks = require("mocks");

var HTTPRequest = require("core/http/http_request").default;
var Runtime = require("runtime").default;

describe("HTTPRequest", function() {
  var xhr;
  var hooks;
  var request;

  var lastXHR;

  beforeEach(function() {
    hooks = {
      getRequest: jasmine.createSpy().andCallFake(function() {
        lastXHR = Mocks.getXHR();
        return lastXHR;
      }),
      abortRequest: jasmine.createSpy()
    };

    spyOn(Runtime, "addUnloadListener");
    spyOn(Runtime, "removeUnloadListener");

    request = new HTTPRequest(hooks, "GET", "http://example.com");
  });

  describe("#start", function() {
    it("should create a request using the getRequest hook", function() {
      request.start("test");
      expect(hooks.getRequest.calls.length).toEqual(1);
      expect(hooks.getRequest).toHaveBeenCalledWith(request);
    });


    it("should open and send the request", function() {
      request.start("test payload");
      expect(lastXHR.open).toHaveBeenCalledWith(
        "GET", "http://example.com", true
      );
      expect(lastXHR.send).toHaveBeenCalledWith("test payload");
    });

    it("should register an unloader", function() {
      request.start("test payload");

      expect(Runtime.addUnloadListener).toHaveBeenCalledWith(
        jasmine.any(Function)
      );
    });

    it("raised by XMLHttpRequest#open", function() {
      hooks.getRequest = function() {
        xhr = Mocks.getXHR();
        xhr.open.andThrow("open exception");
        return xhr;
      };
      expect(function() {
        request.start();
      }).toThrow("open exception");
    });

    it("should re-throw the exception raised by XMLHttpRequest#send", function() {
      hooks.getRequest = function() {
        xhr = Mocks.getXHR();
        xhr.send.andThrow("send exception");
        return xhr;
      };
      expect(function() {
        request.start();
      }).toThrow("send exception");
    });
  });

  describe("#close", function() {
    beforeEach(function() {
      request.start();
    });

    it("should abort the request using the abortRequest hook", function() {
      request.close();
      expect(hooks.abortRequest.calls.length).toEqual(1);
      expect(hooks.abortRequest).toHaveBeenCalledWith(lastXHR);
    });

    it("should unregister the unloader", function() {
      var unloader = Runtime.addUnloadListener.calls[0].args[0];
      request.close();
      expect(Runtime.removeUnloadListener).toHaveBeenCalledWith(unloader);
    });
  });

  describe("on chunk", function() {
    var onChunk;

    beforeEach(function() {
      onChunk = jasmine.createSpy("onChunk");
      request.bind("chunk", onChunk);
      request.start();
    });

    it("should emit the first chunk", function() {
      request.onChunk(200, "chunk1\n");
      expect(onChunk).toHaveBeenCalledWith({ status: 200, data: "chunk1" });
    });

    it("should emit two chunks received one after another", function() {
      request.onChunk(201, "c1\n");
      expect(onChunk.calls.length).toEqual(1);
      expect(onChunk).toHaveBeenCalledWith({ status: 201, data: "c1" });

      request.onChunk(201, "c1\nc2\n");
      expect(onChunk.calls.length).toEqual(2);
      expect(onChunk).toHaveBeenCalledWith({ status: 201, data: "c2" });
    });

    it("should emit all chunks send in one batch", function() {
      request.onChunk(200, "c1\nc2\nc3\n");
      expect(onChunk.calls.length).toEqual(3);
      expect(onChunk.calls[0].args[0]).toEqual({ status: 200, data: "c1" });
      expect(onChunk.calls[1].args[0]).toEqual({ status: 200, data: "c2" });
      expect(onChunk.calls[2].args[0]).toEqual({ status: 200, data: "c3" });
    });

    it("should not emit an unfinished chunk", function() {
      request.onChunk(200, "whatever");
      expect(onChunk).not.toHaveBeenCalled();
    });

    it("should emit 'buffer_too_long' after 256KB", function() {
      var onBufferTooLong = jasmine.createSpy("onBufferTooLong");
      request.bind("buffer_too_long", onBufferTooLong);

      var kilobyteChunk = new Array(1024).join("x"); // 1023B

      var response = new Array(256).join(kilobyteChunk + "\n");
      request.onChunk(200, response); // 255KB
      expect(onBufferTooLong).not.toHaveBeenCalled();

      response = response + kilobyteChunk + "x"; // 256KB
      request.onChunk(200, response); // 255KB
      expect(onBufferTooLong).not.toHaveBeenCalled();

      response = response + "\n"; // 256KB + 1B
      request.onChunk(200, response); // 255KB
      expect(onBufferTooLong).toHaveBeenCalled();
    });

    it("should emit all chunks before 'buffer_too_long'", function() {
      request.bind("buffer_too_long", function() {
        request.unbind_all();
      });

      var kilobyteChunk = new Array(1024).join("x"); // 1023B
      request.onChunk(
        200,
        new Array(256).join(kilobyteChunk + "\n") + kilobyteChunk + "x" + "\n"
      ); // 256KB + 1B
      expect(onChunk.calls.length).toEqual(256);
    });
  });

  describe("on request end", function() {
    beforeEach(function() {
      request.start();
    });
  });

  describe("on page unload", function() {
    var unloader;

    beforeEach(function() {
      request.start("test payload");
      unloader = Runtime.addUnloadListener.calls[0].args[0];
    });

    it("should abort the request using the abortRequest hook", function() {
      unloader();
      expect(hooks.abortRequest.calls.length).toEqual(1);
      expect(hooks.abortRequest).toHaveBeenCalledWith(lastXHR);
    });

    it("should unregister the unloader", function() {
      unloader();
      expect(Runtime.removeUnloadListener).toHaveBeenCalledWith(unloader);
    });
  });
});
