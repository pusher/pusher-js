var Authorizer = require('core/auth/pusher_authorizer').default;
var Logger = require('core/logger');
var Mocks = require('mocks');
var Util = require('core/util').default;
var Factory = require('core/utils/factory').default;
var Logger = require('core/logger').default;
var Runtime = require('runtime').default;

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
    spyOn(Runtime, "getDocument").andReturn(document);

    spyOn(Logger, "warn");
    authorizer.authorize("1.23", function() {});

    expect(Logger.warn).toHaveBeenCalledWith(
      "Warn",
      "To send headers with the auth request, you must use AJAX, rather than JSONP."
    );
  });
});
