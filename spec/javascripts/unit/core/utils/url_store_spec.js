var url_store = require('core/utils/url_store').default;

describe('url_store', function(){
  describe('buildLogSuffix', function(){
    it('should build a log suffix for known keys', function(){
      var suffix = url_store.buildLogSuffix('authentication_endpoint');
      expect(suffix).toEqual('Check out: https://pusher.com/docs/authenticating_users');
    });
    it('should return a blank suffix for unknown keys', function(){
      var suffix = url_store.buildLogSuffix('something_unknown');
      expect(suffix).toEqual('');
    });
  });
});
