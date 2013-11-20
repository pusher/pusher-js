describe("HTTPCORSRequest", function() {
  var _XMLHttpRequest = window.XMLHttpRequest;

  var xhr;
  var request;

  beforeEach(function() {
    window.XMLHttpRequest = jasmine.createSpy("XMLHttpRequest");
    window.XMLHttpRequest.andCallFake(Pusher.Mocks.getXHR);

    spyOn(Pusher.Util, "addWindowListener");
    spyOn(Pusher.Util, "removeWindowListener");

    request = new Pusher.HTTPCORSRequest("GET", "http://example.com");
    xhr = request.xhr;
  });

  afterEach(function() {
    window.XMLHttpRequest = _XMLHttpRequest;
  });

  describe("#start", function() {
    it("should open and send the request", function() {
      request.start("test payload");

      expect(xhr.open).toHaveBeenCalledWith(
        "GET", "http://example.com", true
      );
      expect(xhr.send).toHaveBeenCalledWith("test payload");
    });

    it("should register an unloader", function() {
      request.start("test payload");

      expect(Pusher.Util.addWindowListener).toHaveBeenCalledWith(
        "unload", jasmine.any(Function)
      );
    });

    it("should re-throw the exception raised by XMLHttpRequest#open", function() {
      xhr.open.andThrow("open exception");
      expect(function() {
        request.start();
      }).toThrow("open exception");
    });

    it("should re-throw the exception raised by XMLHttpRequest#send", function() {
      xhr.send.andThrow("send exception");
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
      expect(xhr.abort).toHaveBeenCalled();
    });

    it("should remove the onreadystatechange listener", function() {
      request.close();
      expect(xhr.onreadystatechange).toBe(null);
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
      xhr.readyState = 3;
      xhr.status = 200;
      xhr.responseText = "chunk1\n";
      xhr.onreadystatechange();

      expect(onChunk).toHaveBeenCalledWith({ status: 200, data: "chunk1" });
    });

    it("should emit two chunks received one after another", function() {
      xhr.readyState = 3;
      xhr.status = 201;
      xhr.responseText = "c1\n";
      xhr.onreadystatechange();

      expect(onChunk.calls.length).toEqual(1);
      expect(onChunk).toHaveBeenCalledWith({ status: 201, data: "c1" });

      xhr.responseText = "c1\nc2\n";
      xhr.onreadystatechange();

      expect(onChunk.calls.length).toEqual(2);
      expect(onChunk).toHaveBeenCalledWith({ status: 201, data: "c2" });
    });

    it("should emit all chunks send in one batch", function() {
      xhr.readyState = 3;
      xhr.status = 200;
      xhr.responseText = "c1\nc2\nc3\n";
      xhr.onreadystatechange();

      expect(onChunk.calls.length).toEqual(3);
      expect(onChunk.calls[0].args[0]).toEqual({ status: 200, data: "c1" });
      expect(onChunk.calls[1].args[0]).toEqual({ status: 200, data: "c2" });
      expect(onChunk.calls[2].args[0]).toEqual({ status: 200, data: "c3" });
    });

    it("should not emit an unfinished chunk", function() {
      xhr.readyState = 3;
      xhr.status = 200;
      xhr.responseText = "whatever";
      xhr.onreadystatechange();

      expect(onChunk).not.toHaveBeenCalled();
    });

    it("should emit 'buffer_too_long' after 256KB", function() {
      var onBufferTooLong = jasmine.createSpy("onBufferTooLong");
      request.bind("buffer_too_long", onBufferTooLong);

      var kilobyteChunk = new Array(1024).join("x"); // 1023B

      xhr.readyState = 3;
      xhr.status = 200;
      xhr.responseText = new Array(256).join(kilobyteChunk + "\n"); // 255KB

      xhr.onreadystatechange();
      expect(onBufferTooLong).not.toHaveBeenCalled();

      xhr.responseText = xhr.responseText + kilobyteChunk + "x"; // 256KB
      xhr.onreadystatechange();
      expect(onBufferTooLong).not.toHaveBeenCalled();

      xhr.responseText = xhr.responseText + "\n"; // 256KB + 1B
      xhr.onreadystatechange();
      expect(onBufferTooLong).toHaveBeenCalled();
    });

    it("should emit all chunks before 'buffer_too_long'", function() {
      request.bind("buffer_too_long", function() {
        request.unbind_all();
      });

      var kilobyteChunk = new Array(1024).join("x"); // 1023B

      xhr.readyState = 3;
      xhr.status = 200;
      xhr.responseText = new Array(256).join(kilobyteChunk + "\n");
      xhr.responseText = xhr.responseText + kilobyteChunk + "x" + "\n";
      xhr.onreadystatechange();

      expect(onChunk.calls.length).toEqual(256);
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

      xhr.readyState = 4;
      xhr.status = 200;
      xhr.responseText = "1\n2\n";
      xhr.onreadystatechange();

      expect(onChunk.calls[0].args[0]).toEqual({ status: 200, data: "1" });
      expect(onChunk.calls[1].args[0]).toEqual({ status: 200, data: "2" });
    });

    it("should abort the request", function() {
      xhr.readyState = 4;
      xhr.status = 200;
      xhr.responseText = "";
      xhr.onreadystatechange();
      expect(xhr.abort).toHaveBeenCalled();
    });

    it("should remove the onreadystatechange listener", function() {
      xhr.readyState = 4;
      xhr.status = 200;
      xhr.responseText = "";
      xhr.onreadystatechange();
      expect(xhr.onreadystatechange).toBe(null);
    });

    it("should unregister the unloader", function() {
      var unloader = Pusher.Util.addWindowListener.calls[0].args[1];

      xhr.readyState = 4;
      xhr.status = 200;
      xhr.responseText = "";
      xhr.onreadystatechange();
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
      expect(xhr.abort).toHaveBeenCalled();
    });

    it("should remove the onreadystatechange listener", function() {
      unloader();
      expect(xhr.onreadystatechange).toBe(null);
    });

    it("should unregister the unloader", function() {
      unloader();
      expect(Pusher.Util.removeWindowListener).toHaveBeenCalledWith(
        "unload", unloader
      );
    });
  });
});
