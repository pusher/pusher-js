var TestEnv = require('testenv');
var Authorizer = require('core/auth/pusher_authorizer').default;
var Logger = require('core/logger');
var Mocks = require('mocks');
var Util = require('core/util').default;
var Factory = require('core/utils/factory').default;
var Logger = require('core/logger').default;
var Runtime = require('runtime').default;

describe("Authorizer", function() {

  describe("initialization", function(){
    it("should throw an error if the specified transport is unrecognized", function(){
      expect(function(){
        new Authorizer({name: "chan"}, {
          authTransport: "yolo"
        })
      }).toThrow("'yolo' is not a recognized auth transport");
    });
  });

  describe("#composeQuery", function() {
    it("should return str with just socket id and channel name if no auth query options", function() {
      var authorizer = new Authorizer({ name: "chan" }, {authTransport: "ajax"});

      expect(authorizer.composeQuery("1.1"))
        .toEqual("socket_id=1.1&channel_name=chan");
    });

    it("should add query params specified in options object", function() {
      var authorizer = new Authorizer(
        { name: "chan" },
        { auth: {
            params: { a: 1, b: 2 }
          },
          authTransport: "ajax"
        }
      );

      expect(authorizer.composeQuery("1.1"))
        .toEqual("socket_id=1.1&channel_name=chan&a=1&b=2");
    });
  });

});

if (TestEnv !== "worker") {
  describe("AJAX Authorizer", function() {
    var xhr;

    beforeEach(function() {
      xhr = new Mocks.getXHR();

      if (TestEnv === "web" && !window.XMLHttpRequest) {
        spyOn(Runtime, "createMicrosoftXHR").andReturn(xhr);
      } else {
        spyOn(Runtime, "createXHR").andReturn(xhr);
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

    it("should call back with auth result on success", function() {
      var authorizer = new Authorizer(
        { name: "chan" },
        { authTransport: "ajax" }
      );

      var data = { foo: "bar", number: 1};
      var dataJSON = JSON.stringify(data);

      var callback = jasmine.createSpy("callback");
      authorizer.authorize("1.23", callback);

      if (TestEnv === "web" && !window.XMLHttpRequest) {
        expect(Runtime.createMicrosoftXHR.calls.length).toEqual(1);
      } else {
        expect(Runtime.createXHR.calls.length).toEqual(1);
      }

      xhr.readyState = 4;
      xhr.status = 200;
      xhr.responseText = dataJSON;
      xhr.onreadystatechange();

      expect(callback.calls.length).toEqual(1);
      expect(callback).toHaveBeenCalledWith(false, data);
    });

    it("should call back with an error if JSON in xhr.responseText is invalid", function() {
      var authorizer = new Authorizer(
        { name: "chan" },
        { authTransport: "ajax" }
      );
      var invalidJSON = 'INVALID { "something": "something"}';
      var callback = jasmine.createSpy("callback");
      authorizer.authorize("1.23", callback);

      if (TestEnv === "web" && !window.XMLHttpRequest) {
        expect(Runtime.createMicrosoftXHR.calls.length).toEqual(1);
      } else {
        expect(Runtime.createXHR.calls.length).toEqual(1);
      }

      xhr.readyState = 4;
      xhr.status = 200;
      xhr.responseText = invalidJSON;
      xhr.onreadystatechange();

      expect(callback.calls.length).toEqual(1);
      expect(callback).toHaveBeenCalledWith(
        true,
        "JSON returned from auth endpoint was invalid, yet status code was 200. " +
          "Data was: " +
          invalidJSON
      );
    });
  });
}
