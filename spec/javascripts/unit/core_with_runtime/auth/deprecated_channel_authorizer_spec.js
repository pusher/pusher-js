var ChannelAuthorizerProxy = require('core/auth/deprecated_channel_authorizer').ChannelAuthorizerProxy;

describe("ChannelAuthorizerProxy", function() {

  describe("initialization", function(){
    it("should call the old authorizer properly", function(){
      const channel = {};
      const pusher = {
        channel: jasmine.createSpy('channel').and.returnValue(channel)
      }
      
      const authOptions = {
        transport: "bad-transport",
        endpoint: "http://example.com/auth",
        params: { foo: "bar" },
        headers: { "X-Foo": "my-bar" }
      };
      const oldAuthParams = {
        authTransport: "bad-transport",
        authEndpoint: "http://example.com/auth",
        auth: {
          params: { foo: "bar" },
          headers: { "X-Foo": "my-bar" }
        }
      }
      const oldAuthorizer = {
        authorize:jasmine.createSpy('oldAuthorizer')
      };
      const oldAuthorizerGenerator = jasmine.createSpy("oldAuthorizerGenerator").and.returnValue(oldAuthorizer);

      channelAuthorizer = ChannelAuthorizerProxy(pusher, authOptions, oldAuthorizerGenerator)
      
      const params = { socketId: "1.23", channelName: "private-test-channel"};
      const callback = function() {};
      channelAuthorizer(params, callback);

      expect(pusher.channel.calls.count()).toEqual(1);
      expect(pusher.channel).toHaveBeenCalledWith('private-test-channel');

      expect(oldAuthorizerGenerator.calls.count()).toEqual(1);
      expect(oldAuthorizerGenerator).toHaveBeenCalledWith(channel, oldAuthParams);

      expect(oldAuthorizer.authorize.calls.count()).toEqual(1);
      expect(oldAuthorizer.authorize).toHaveBeenCalledWith("1.23", callback);
    });
  });

});