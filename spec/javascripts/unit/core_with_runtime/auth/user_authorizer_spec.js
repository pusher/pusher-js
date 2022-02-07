var Runtime = require('runtime').default;
var UserAuthorizer = require('core/auth/user_authorizer').default;

describe("UserAuthorizer", function() {

  describe("initialization", function(){
    it("should throw an error if the specified transport is unrecognized", function(){
      const channelAuth = {
        transport: "bad-transport",
      };
      expect(function(){
        UserAuthorizer(channelAuth)
      }).toThrow("'bad-transport' is not a recognized auth transport");
    });
  });

  describe("user AuthHandler", function(){
    it("should call the specified transport authorizer", function(){
      const userAuth = {
        transport: "ajax",
      };
      userAuthorizer = UserAuthorizer(userAuth);
      
      transportAuthorizer = jasmine.createSpy("ajax")
      Runtime.getAuthorizers = jasmine.createSpy("getAuthorizers").and.returnValue({
        ajax: transportAuthorizer
      });

      const params = { socketId: '1.23' };
      const callback = function(){};
      const query = 'socket_id=1.23';
      userAuthorizer(params, callback);
      expect(Runtime.getAuthorizers.calls.count()).toEqual(1);
      expect(transportAuthorizer).toHaveBeenCalledWith(
        Runtime,
        query,
        userAuth,
        callback);
    });
  });
});