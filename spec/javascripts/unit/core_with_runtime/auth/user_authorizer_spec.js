var Runtime = require('runtime').default;
var UserAuthenticator = require('core/auth/user_authenticator').default;

describe("UserAuthenticator", function() {

  describe("initialization", function(){
    it("should throw an error if the specified transport is unrecognized", function(){
      const userAuthentication = {
        transport: "bad-transport",
      };
      expect(function(){
        UserAuthenticator(userAuthentication)
      }).toThrow("'bad-transport' is not a recognized auth transport");
    });
  });

  describe("user AuthHandler", function(){
    let _getAuthorizers;

    beforeAll(function() {
      _getAuthorizers = Runtime.getAuthorizers;
    });

    afterAll(function() {
      Runtime.getAuthorizers = _getAuthorizers;
    });

    it("should call the specified transport authorizer", function(){
      const userAuthentication = {
        transport: "ajax",
      };
      userAuthenticator = UserAuthenticator(userAuthentication);

      transportAuthorizer = jasmine.createSpy("ajax")
      Runtime.getAuthorizers = jasmine.createSpy("getAuthorizers").and.returnValue({
        ajax: transportAuthorizer
      });

      const params = { socketId: '1.23' };
      const callback = function(){};
      const query = 'socket_id=1.23';
      userAuthenticator(params, callback);
      expect(Runtime.getAuthorizers.calls.count()).toEqual(1);
      expect(transportAuthorizer).toHaveBeenCalledWith(
        Runtime,
        query,
        userAuthentication,
        'user-authentication',
        callback);
    });

    it("should call the specified transport authorizer with params", function(){
      const userAuthentication = {
        transport: "ajax",
        params: { abc: '123' }
      };
      userAuthenticator = UserAuthenticator(userAuthentication);

      transportAuthorizer = jasmine.createSpy("ajax")
      Runtime.getAuthorizers = jasmine.createSpy("getAuthorizers").and.returnValue({
        ajax: transportAuthorizer
      });

      const params = { socketId: '1.23' };
      const callback = function(){};
      const query = 'socket_id=1.23&abc=123';
      userAuthenticator(params, callback);
      expect(Runtime.getAuthorizers.calls.count()).toEqual(1);
      expect(transportAuthorizer).toHaveBeenCalledWith(
        Runtime,
        query,
        userAuthentication,
        'user-authentication',
        callback);
    });

    it("should call the specified transport authorizer with paramsProvider", function(){
      const userAuthentication = {
        transport: "ajax",
        paramsProvider: () => { return { abc: '123' }; }
      };
      userAuthenticator = UserAuthenticator(userAuthentication);

      transportAuthorizer = jasmine.createSpy("ajax")
      Runtime.getAuthorizers = jasmine.createSpy("getAuthorizers").and.returnValue({
        ajax: transportAuthorizer
      });

      const params = { socketId: '1.23' };
      const callback = function(){};
      const query = 'socket_id=1.23&abc=123';
      userAuthenticator(params, callback);
      expect(Runtime.getAuthorizers.calls.count()).toEqual(1);
      expect(transportAuthorizer).toHaveBeenCalledWith(
        Runtime,
        query,
        userAuthentication,
        'user-authentication',
        callback);
    });

    it("should call the specified transport authorizer with params and paramsProvider", function(){
      const userAuthentication = {
        transport: "ajax",
        params: { abc: '123' },
        paramsProvider: () => { return { def: '456' }; }
      };
      userAuthenticator = UserAuthenticator(userAuthentication);

      transportAuthorizer = jasmine.createSpy("ajax")
      Runtime.getAuthorizers = jasmine.createSpy("getAuthorizers").and.returnValue({
        ajax: transportAuthorizer
      });

      const params = { socketId: '1.23' };
      const callback = function(){};
      const query = 'socket_id=1.23&abc=123&def=456';
      userAuthenticator(params, callback);
      expect(Runtime.getAuthorizers.calls.count()).toEqual(1);
      expect(transportAuthorizer).toHaveBeenCalledWith(
        Runtime,
        query,
        userAuthentication,
        'user-authentication',
        callback);
    });
  });
});
