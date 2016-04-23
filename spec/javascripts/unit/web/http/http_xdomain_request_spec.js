var Mocks = require('mocks');
var Errors = require('core/errors');
var Factory = require('core/utils/factory').default;

describe("HTTP.getXDR", function() {
  var _XDomainRequest = window.XDomainRequest;

  var hooks, method, url;
  var request;
  var HTTPFactory;

  beforeEach(function() {
    HTTPFactory = require('runtime').default.HTTPFactory;


    window.XDomainRequest = jasmine.createSpy().andCallFake(
      Mocks.getXHR
    );;

    spyOn(HTTPFactory, "createRequest").andCallFake(function(h, m, u) {
      hooks = h;
      method = m;
      url = u;
      return Mocks.getHTTPRequest(m, u);
    });

    request = HTTPFactory.createXDR("HEAD", "http://example.net");
  });

  afterEach(function() {
    window.XDomainRequest = _XDomainRequest;
  });

  it("should pass the correct method to the request", function() {
    expect(request.method).toEqual("HEAD");
  });

  it("should pass the correct URL to the request", function() {
    expect(request.url).toEqual("http://example.net");
  });

  describe("hooks", function() {
    var xdr;
    var socket;

    beforeEach(function() {
      socket = Mocks.getHTTPSocket();
      xdr = hooks.getRequest(socket);
    });

    describe("request returned from #getRequest", function() {
      describe("on XDR timeout", function() {
        it("should close the socket", function() {
          xdr.ontimeout();
          expect(socket.close.calls.length).toEqual(1);
        });

        it("should emit an RequestTimedOut error before closing the socket", function() {
          var onError = jasmine.createSpy();
          socket.bind("error", onError);

          socket.close.andCallFake(function() {
            expect(onError.calls.length).toEqual(1);
            expect(onError).toHaveBeenCalledWith(
              jasmine.any(Errors.RequestTimedOut)
            );
          });

          xdr.ontimeout();
        });
      });

      describe("on XDR error", function() {
        it("should close the socket", function() {
          xdr.onerror("test error");
          expect(socket.close.calls.length).toEqual(1);
        });

        it("should emit the error before closing the socket", function() {
          var onError = jasmine.createSpy();
          socket.bind("error", onError);

          socket.close.andCallFake(function() {
            expect(onError.calls.length).toEqual(1);
            expect(onError).toHaveBeenCalledWith("test error");
          });

          xdr.onerror("test error");
        });
      });

      describe("on XDR progress", function() {
        it("should not call socket.onChunk if there is no responseText", function() {
          xdr.responseText = undefined;

          xdr.onprogress();
          expect(socket.onChunk).not.toHaveBeenCalled();
        });

        it("should not call socket.onChunk if responseText is an empty string", function() {
          xdr.responseText = "";

          xdr.onprogress();
          expect(socket.onChunk).not.toHaveBeenCalled();
        });

        it("should call socket.onChunk if responseText is not empty", function() {
          xdr.responseText = "asdf";

          xdr.onprogress();
          expect(socket.onChunk.calls.length).toEqual(1);
          expect(socket.onChunk).toHaveBeenCalledWith(200, "asdf");
        });

        it("should always call socket.onChunk with the whole responseText", function() {
          xdr.responseText = "asdf";

          xdr.onprogress();
          expect(socket.onChunk.calls.length).toEqual(1);
          expect(socket.onChunk).toHaveBeenCalledWith(200, "asdf");

          xdr.responseText = "asdfghjkl";
          xdr.onprogress();
          expect(socket.onChunk.calls.length).toEqual(2);
          expect(socket.onChunk).toHaveBeenCalledWith(200, "asdfghjkl");
        });
      });

      describe("on XDR load", function() {
        it("should close the socket", function() {
          xdr.responseText = "";

          xdr.onload();
          expect(socket.close.calls.length).toEqual(1);
        });

        it("should not call socket.onChunk if there is no responseText", function() {
          xdr.responseText = undefined;

          xdr.onload();
          expect(socket.onChunk).not.toHaveBeenCalled();
        });

        it("should not call socket.onChunk if responseText is an empty string", function() {
          xdr.responseText = "";

          xdr.onload();
          expect(socket.onChunk).not.toHaveBeenCalled();
        });

        it("should call socket.onChunk before closing if responseText is not empty", function() {
          xdr.responseText = "12356890";

          socket.close.andCallFake(function() {
            expect(socket.onChunk.calls.length).toEqual(1);
            expect(socket.onChunk).toHaveBeenCalledWith(200, "12356890");
          });

          xdr.onload();
        });

        it("should emit finished with status code 200 before closing", function() {
          xdr.responseText = "";

          var onFinished = jasmine.createSpy();
          socket.bind("finished", onFinished);

          socket.close.andCallFake(function() {
            expect(onFinished.calls.length).toEqual(1);
            expect(onFinished).toHaveBeenCalledWith(200);
          });

          xdr.onload();
        });
      });
    });

    describe("#abortRequest", function() {
      it("should abort the passed request", function() {
        expect(xdr.abort.calls.length).toEqual(0);
        hooks.abortRequest(xdr);
        expect(xdr.abort.calls.length).toEqual(1);
      });

      it("should set the ontimeout listener to null before calling abort", function() {
        xdr.ontimeout = function() {};
        xdr.abort.andCallFake(function() {
          expect(xdr.ontimeout).toBe(null);
        });

        hooks.abortRequest(xdr);
      });

      it("should set the onerror listener to null before calling abort", function() {
        xdr.onerror = function() {};
        xdr.abort.andCallFake(function() {
          expect(xdr.onerror).toBe(null);
        });

        hooks.abortRequest(xdr);
      });

      it("should set the onprogress listener to null before calling abort", function() {
        xdr.onprogress = function() {};
        xdr.abort.andCallFake(function() {
          expect(xdr.onprogress).toBe(null);
        });

        hooks.abortRequest(xdr);
      });

      it("should set the onload listener to null before calling abort", function() {
        xdr.onload = function() {};
        xdr.abort.andCallFake(function() {
          expect(xdr.onload).toBe(null);
        });

        hooks.abortRequest(xdr);
      });
    });
  });
});
