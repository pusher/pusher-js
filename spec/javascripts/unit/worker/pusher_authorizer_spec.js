var Authorizer = require('core/auth/pusher_authorizer').default;
var fetchAuth = require('worker/auth/fetch_auth').default;
var Runtime = require('runtime').default;
var fetchMock = require('fetch-mock');

var endpoint = 'http://example.org/pusher/auth';

describe("Fetch Authorizer", function(){

  beforeEach(function(){
    Authorizer.authorizers = {ajax: fetchAuth}
  });

  afterEach(function(){
    fetchMock.restore();
  });

  it("should pass headers in the request", function(){
    fetchMock
      .mock(endpoint, {body: {hello: "world"}});

    var headers = { "foo": "bar", "n": 42 };
    var authorizer = new Authorizer(
      { name: "chan" },
      { authTransport: "ajax",
        authEndpoint: endpoint,
        auth: {
          headers: headers
        }
      }
    );

    authorizer.authorize("1.23", function() {});

    var lastCall = fetchMock.lastCall(endpoint)[0];
    var sentHeaders = lastCall.headers;
    expect(sentHeaders.get("Content-Type")).toEqual("application/x-www-form-urlencoded");
    expect(sentHeaders.get("foo")).toEqual("bar");
    expect(sentHeaders.get("n")).toEqual('42');
  });

  it("should pass params in the query string", function(){
    fetchMock
      .mock(endpoint, {body: {hello: "world"}});

    var params = { "a": 1, "b": 2 };
    var authorizer = new Authorizer(
      { name: "chan" },
      { authTransport: "ajax",
        authEndpoint: endpoint,
        auth: {
          params: params
        }
      }
    );
    authorizer.authorize("1.23", function() {}).then(function(){
      var lastCall = fetchMock.lastCall(endpoint)[0];
      console.log(lastCall);
      expect(lastCall.body).toEqual("socket_id=1.23&channel_name=chan&a=1&b=2");
    });
  });

  it("should call back with the auth result on success", function(){
    var data = { foo: "bar", number: 1};
    var dataJSON = JSON.stringify(data);

    fetchMock.mock(endpoint, {
      body: dataJSON
    })

    var authorizer = new Authorizer(
      { name: "chan" },
      {
        authTransport: "ajax",
        authEndpoint: endpoint
      }
    );
    var callback = jasmine.createSpy("callback");
    authorizer.authorize("1.23", callback).then(function(){
      expect(callback.calls.length).toEqual(1);
      expect(callback).toHaveBeenCalledWith(false, data);
    });
  });

  it("should call back with an error if JSON is invalid", function(){
    var authorizer = new Authorizer(
      { name: "chan" },
      {
        authTransport: "ajax",
        authEndpoint: endpoint
      }
    );

    var invalidJSON = 'INVALID { "something": "something"}';
    fetchMock.mock(endpoint, {
      body: invalidJSON
    })

    var callback = jasmine.createSpy("callback");

    authorizer.authorize("1.23", callback).then(function(){
      expect(callback.calls.length).toEqual(1);
      expect(callback).toHaveBeenCalledWith(
        true,
        "JSON returned from auth endpoint was invalid, yet status code was 200. " +
          "Data was: " +
          invalidJSON
      );
    });
  });
});
