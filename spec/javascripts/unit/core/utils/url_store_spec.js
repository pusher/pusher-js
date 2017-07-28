var url_store = require('core/utils/url_store').default;

describe('url_store', function(){
  describe('buildLogSuffix', function(){
    it('should build a log suffix for known keys', function(){
      var suffix = url_store.buildLogSuffix('authenticationEndpoint');
      expect(suffix).toEqual('See: https://pusher.com/docs/authenticating_users');
    });
    it('should return a blank suffix for unknown keys', function(){
      var suffix = url_store.buildLogSuffix('somethingUnknown');
      expect(suffix).toEqual('');
    });
  });
});
