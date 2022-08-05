var Runtime = require('runtime').default;
var ChannelAuthorizer = require('core/auth/channel_authorizer').default;

describe("ChannelAuthorizer", function() {

  describe("initialization", function(){
    it("should throw an error if the specified transport is unrecognized", function(){
      const authOptions = {
        transport: "bad-transport",
      };
      expect(function(){
        ChannelAuthorizer(authOptions)
      }).toThrow("'bad-transport' is not a recognized auth transport");
    });
  });

  describe("channel AuthHandler", function(){
    let _getAuthorizers;

    beforeAll(function() {
      _getAuthorizers = Runtime.getAuthorizers;
    });

    afterAll(function() {
      Runtime.getAuthorizers = _getAuthorizers;
    });

    it("should call the specified transport authorizer", function(){
      const authOptions = {
        transport: "ajax",
        endpoint: "http://example.com/auth",
        params: { foo: "bar" },
        headers: { "X-Foo": "my-bar" }
      };
      channelAuthorizer = ChannelAuthorizer(authOptions);

      transportAuthorizer = jasmine.createSpy("ajax")
      Runtime.getAuthorizers = jasmine.createSpy("getAuthorizers").and.returnValue({
        ajax: transportAuthorizer
      });

      const params = { socketId: '1.23', channelName: 'private-test' };
      const callback = function(){};
      const query = 'socket_id=1.23&channel_name=private-test&foo=bar';
      channelAuthorizer(params, callback);
      expect(Runtime.getAuthorizers.calls.count()).toEqual(1);
      expect(transportAuthorizer).toHaveBeenCalledWith(
        Runtime,
        query,
        authOptions,
        'channel-authorization',
        callback);
    });
  });
});
