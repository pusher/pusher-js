var ChannelAuthorizerProxy = require('core/auth/deprecated_channel_authorizer').ChannelAuthorizerProxy;

describe("ChannelAuthorizerProxy", function() {

  describe("initialization", function(){
    it("should call the deprecated authorizer properly", function(){
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
      const deprecatedAuthorizerParams = {
        authTransport: "bad-transport",
        authEndpoint: "http://example.com/auth",
        auth: {
          params: { foo: "bar" },
          headers: { "X-Foo": "my-bar" }
        }
      }
      const deprecatedAuthorizer = {
        authorize:jasmine.createSpy('deprecatedAuthorizer')
      };
      const deprecatedAuthorizerGenerator = jasmine.createSpy("deprecatedAuthorizerGenerator").and.returnValue(deprecatedAuthorizer);

      channelAuthorizer = ChannelAuthorizerProxy(pusher, authOptions, deprecatedAuthorizerGenerator)
      
      const params = { socketId: "1.23", channelName: "private-test-channel"};
      const callback = function() {};
      channelAuthorizer(params, callback);

      expect(pusher.channel.calls.count()).toEqual(1);
      expect(pusher.channel).toHaveBeenCalledWith('private-test-channel');

      expect(deprecatedAuthorizerGenerator.calls.count()).toEqual(1);
      expect(deprecatedAuthorizerGenerator).toHaveBeenCalledWith(channel, deprecatedAuthorizerParams);

      expect(deprecatedAuthorizer.authorize.calls.count()).toEqual(1);
      expect(deprecatedAuthorizer.authorize).toHaveBeenCalledWith("1.23", callback);
    });
  });

});