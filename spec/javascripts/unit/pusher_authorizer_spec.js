var Authorizer = require('pusher_authorizer');
var Mocks = require('mocks');
var Logger = require('logger');

describe("Authorizer", function() {
  describe("#composeQuery", function() {
    it("should return str with just socket id and channel name if no auth query options", function(test) {
      var authorizer = new Authorizer({ name: "chan" }, {});

      expect(authorizer.composeQuery("1.1"))
        .toEqual("socket_id=1.1&channel_name=chan");
    });

    it("should add query params specified in options object", function(test) {
      var authorizer = new Authorizer(
        { name: "chan" },
        { auth: {
            params: { a: 1, b: 2 }
          }
        }
      );

      expect(authorizer.composeQuery("1.1"))
        .toEqual("socket_id=1.1&channel_name=chan&a=1&b=2");
    });
  });

});

describe("AJAX Authorizer", function() {
  var xhr;

  beforeEach(function() {
    xhr = new Mocks.getXHR();
    if (window.XMLHttpRequest) {
      spyOn(window, "XMLHttpRequest").andReturn(xhr);
    } else {
      spyOn(window, "ActiveXObject").andReturn(xhr);
    }
  });

  it("should pass headers in the request", function() {
    var headers = { "foo": "bar", "n": 42 };
    var authorizer = new Authorizer(
      { name: "chan" },
      { authTransport: "ajax",
        auth: {
          headers: headers
        }
      }
    );
    authorizer.authorize("1.23", function() {});

    expect(xhr.setRequestHeader.calls.length).toEqual(3);
    expect(xhr.setRequestHeader).toHaveBeenCalledWith(
      "Content-Type", "application/x-www-form-urlencoded"
    );
    expect(xhr.setRequestHeader).toHaveBeenCalledWith("foo", "bar");
    expect(xhr.setRequestHeader).toHaveBeenCalledWith("n", 42);
  });

  it("should pass params in the query string", function() {
    var params = { "a": 1, "b": 2 };
    var authorizer = new Authorizer(
      { name: "chan" },
      { authTransport: "ajax",
        auth: {
          params: params
        }
      }
    );
    authorizer.authorize("1.23", function() {});

    expect(xhr.send.calls.length).toEqual(1);
    expect(xhr.send).toHaveBeenCalledWith(
      "socket_id=1.23&channel_name=chan&a=1&b=2"
    );
  });

  it("should call back with auth result on success", function(test) {
    var authorizer = new Authorizer(
      { name: "chan" },
      { authTransport: "ajax" }
    );

    var data = { foo: "bar", number: 1};
    var dataJSON = JSON.stringify(data);

    var callback = jasmine.createSpy("callback");
    authorizer.authorize("1.23", callback);

    if (window.XMLHttpRequest) {
      expect(window.XMLHttpRequest.calls.length).toEqual(1);
    } else {
      expect(window.ActiveXObject.calls.length).toEqual(1);
      expect(window.ActiveXObject).toHaveBeenCalledWith("Microsoft.XMLHTTP");
    }

    xhr.readyState = 4;
    xhr.status = 200;
    xhr.responseText = dataJSON;
    xhr.onreadystatechange();

    expect(callback.calls.length).toEqual(1);
    expect(callback).toHaveBeenCalledWith(false, data);
  });

  it("should call back with an error if JSON in xhr.responseText is invalid", function(test) {
    var authorizer = new Authorizer(
      { name: "chan" },
      { authTransport: "ajax" }
    );
    var invalidJSON = 'INVALID { "something": "something"}';
    var callback = jasmine.createSpy("callback");

    authorizer.authorize("1.23", callback);

    if (window.XMLHttpRequest) {
      expect(window.XMLHttpRequest.calls.length).toEqual(1);
    } else {
      expect(window.ActiveXObject.calls.length).toEqual(1);
      expect(window.ActiveXObject).toHaveBeenCalledWith("Microsoft.XMLHTTP");
    }

    xhr.readyState = 4;
    xhr.status = 200;
    xhr.responseText = invalidJSON;
    xhr.onreadystatechange();

    expect(callback.calls.length).toEqual(1);
    expect(callback).toHaveBeenCalledWith(
      true,
      "JSON returned from webapp was invalid, yet status code was 200. " +
        "Data was: " +
        invalidJSON
    );
  });
});

describe("JSONP Authorizer", function() {
  it("should raise a warning if headers are passed", function() {
    var headers = { "foo": "bar", "n": 42 };
    var authorizer = new Authorizer(
      { name: "chan" },
      { authTransport: "jsonp",
        auth: {
          headers: headers
        }
      }
    );

    var document = Mocks.getDocument();
    var script = Mocks.getDocumentElement();
    var documentElement = Mocks.getDocumentElement();

    document.createElement.andReturn(script);
    document.getElementsByTagName.andReturn([]);
    document.documentElement = documentElement;
    spyOn(Util, "getDocument").andReturn(document);

    spyOn(Logger, "warn");
    authorizer.authorize("1.23", function() {});

    expect(Logger.warn).toHaveBeenCalledWith(
      "Warn",
      "To send headers with the auth request, you must use AJAX, rather than JSONP."
    );
  });
});
