var Mocks = require('mocks');
var Runtime = require('runtime').default;

describe("HTTP.getXHR", function() {

  var hooks;
  var request;
  var HTTPFactory;

  beforeEach(function() {
    HTTPFactory = require('runtime').default.HTTPFactory;

    spyOn(Runtime, 'getXHRAPI').andReturn(Mocks.getXHR);

    spyOn(HTTPFactory, "createRequest").andCallFake(function(h, m, u) {
      hooks = h;
      return Mocks.getHTTPRequest(m, u);
    });

    request = HTTPFactory.createXHR("OPTIONS", "http://example.org");
  });

  it("should pass the correct method to the request", function() {
    expect(request.method).toEqual("OPTIONS");
  });

  it("should pass the correct URL to the request", function() {
    expect(request.url).toEqual("http://example.org");
  });

  describe("hooks", function() {
    describe("request returned from #getRequest", function() {
      var xhr;
      var socket;

      beforeEach(function() {
        socket = Mocks.getHTTPSocket();
        xhr = hooks.getRequest(socket);
      });

      describe("on readyState equal 3", function() {
        beforeEach(function() {
          xhr.readyState = 3;
        });

        it("should not call socket.onChunk if there is no responseText", function() {
          xhr.status = 200;
          xhr.responseText = undefined;

          xhr.onreadystatechange();
          expect(socket.onChunk).not.toHaveBeenCalled();
        });

        it("should not call socket.onChunk if responseText is an empty string", function() {
          xhr.status = 200;
          xhr.responseText = "";

          xhr.onreadystatechange();
          expect(socket.onChunk).not.toHaveBeenCalled();
        });

        it("should call socket.onChunk if responseText is not empty", function() {
          xhr.status = 201;
          xhr.responseText = "asdf";

          xhr.onreadystatechange();
          expect(socket.onChunk.calls.length).toEqual(1);
          expect(socket.onChunk).toHaveBeenCalledWith(201, "asdf");
        });

        it("should always call socket.onChunk with the whole responseText", function() {
          xhr.status = 201;
          xhr.responseText = "asdf";

          xhr.onreadystatechange();
          expect(socket.onChunk.calls.length).toEqual(1);
          expect(socket.onChunk).toHaveBeenCalledWith(201, "asdf");

          xhr.responseText = "asdfghjkl";
          xhr.onreadystatechange();
          expect(socket.onChunk.calls.length).toEqual(2);
          expect(socket.onChunk).toHaveBeenCalledWith(201, "asdfghjkl");
        });
      });

      describe("on readyState equal 4", function() {
        beforeEach(function() {
          xhr.readyState = 4;
        });

        it("should close the socket", function() {
          xhr.status = 501;
          xhr.responseText = "";

          xhr.onreadystatechange();
          expect(socket.close.calls.length).toEqual(1);
        });

        it("should not call socket.onChunk if there is no responseText", function() {
          xhr.status = 200;
          xhr.responseText = undefined;

          xhr.onreadystatechange();
          expect(socket.onChunk).not.toHaveBeenCalled();
        });

        it("should not call socket.onChunk if responseText is an empty string", function() {
          xhr.status = 200;
          xhr.responseText = "";

          xhr.onreadystatechange();
          expect(socket.onChunk).not.toHaveBeenCalled();
        });

        it("should call socket.onChunk before closing if responseText is not empty", function() {
          xhr.status = 234;
          xhr.responseText = "12356890";

          socket.close.andCallFake(function() {
            expect(socket.onChunk.calls.length).toEqual(1);
            expect(socket.onChunk).toHaveBeenCalledWith(234, "12356890");
          });

          xhr.onreadystatechange();
        });

        it("should emit finished with the status code before closing", function() {
          xhr.status = 404;
          xhr.responseText = "";

          var onFinished = jasmine.createSpy();
          socket.bind("finished", onFinished);

          socket.close.andCallFake(function() {
            expect(onFinished.calls.length).toEqual(1);
            expect(onFinished).toHaveBeenCalledWith(404);
          });

          xhr.onreadystatechange();
        });
      });
    });

    describe("#abortRequest", function() {
      it("should abort the passed request", function() {
        var xhr = Mocks.getXHR();

        expect(xhr.abort.calls.length).toEqual(0);
        hooks.abortRequest(xhr);
        expect(xhr.abort.calls.length).toEqual(1);
      });

      it("should set the onreadystatechange listener to null before calling abort", function() {
        var xhr = Mocks.getXHR();
        xhr.onreadystatechange = function() {};
        xhr.abort.andCallFake(function() {
          expect(xhr.onreadystatechange).toBe(null);
        });

        hooks.abortRequest(xhr);
      });
    });
  });
});
