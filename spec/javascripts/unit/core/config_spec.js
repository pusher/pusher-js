var TestEnv = require('testenv');
var Config = require('core/config');
var Defaults = require('core/defaults').default;
var Runtime = require('runtime').default;
var nacl = require('tweetnacl')

describe('Config', function() {
  beforeEach(function() {
    if (TestEnv === 'web') {
      spyOn(Runtime, 'getDocument').and.returnValue({
        location: {
          protocol: 'http:'
        }
      });
    }
  });

  it('should populate defaults', function() {
    let config = Config.getConfig({});
    for (let key in getStaticDefaultKeys()) {
      expect(config[key]).toEqual(Defaults[key])
    }
  });

  it('should disable stats by default', function() {
    let config = Config.getConfig({});
    expect(config.enableStats).toEqual(false)
  });

  it('should allow enabling of stats', function() {
    let config = Config.getConfig({enableStats: true});
    expect(config.enableStats).toEqual(true)
  });

  it('should honour deprecated disableStats option', function() {
    let config = Config.getConfig({disableStats: true});
    expect(config.enableStats).toEqual(false)

    config = Config.getConfig({disableStats: false});
    expect(config.enableStats).toEqual(true)
  });


  it('should override config with supplied options', function() {
    let opts = {
      pongTimeout: 123,
      activityTimeout: 345,
      ignoreNullOrigin: true,
      wsHost: 'ws-spec.pusher.com',
      wsPort: 2020,
      wssPort: 2021,
      httpHost: 'socksjs-spec.pusher.com',
      httpPort: 1020,
      httpsPort: 1021,
      enableStats: true
    };
    let config = Config.getConfig(opts);
    expect(config).toEqual(jasmine.objectContaining(opts));
    for (let opt in opts) {
      expect(config[opt]).toEqual(opts[opt]);
    }
  });

  describe('auth', function(){
    it('should create ChannelAuthorizerProxy if authorizer is set', function() {
      const authorizer = { authorize: jasmine.createSpy('authorize') };
      const authorizerGenerator = jasmine.createSpy('authorizerGenerator').and.returnValue(authorizer);
      let opts = {
        authorizer: authorizerGenerator,
        authTransport: 'some-auth-transport',
        authEndpoint: '/pusher/spec/auth',
        auth: {
          params: { spec: 'param' },
          headers: { spec: 'header' }
        },
      };
      const channel = {name: 'private-test'};
      const pusher = { channel: jasmine.createSpy('channel').and.returnValue(channel) };
      let config = Config.getConfig(opts, pusher);
      
      const callback = function(){};
      config.channelAuthorizer({
        socketId: '1.23',
        channelName: 'private-test', 
      }, callback);
      expect(authorizerGenerator).toHaveBeenCalledWith(channel, {
        authTransport: 'some-auth-transport',
        authEndpoint: '/pusher/spec/auth',
        auth: {
          params: { spec: 'param' },
          headers: { spec: 'header' }
        },
      })
      expect(authorizer.authorize).toHaveBeenCalledWith('1.23', callback);
    });

    // We should have tests for:
    // - Not setting authorizer
    // - channelAuth and for the cases where it overrides deprecated fields
    // - userAuth.
    // These are challenging because we can't spy on the imported functions inside config.ts
  });

  describe('TLS', function() {
    it('should use TLS if forceTLS set', function() {
      let config = Config.getConfig({ forceTLS: true });
      expect(config.useTLS).toEqual(true);
    });
    // deprecated
    it('should use TLS if encrypted set', function() {
      let config = Config.getConfig({ encrypted: true });
      expect(config.useTLS).toEqual(true);
    });
    if (TestEnv === 'web') {
      it('should use TLS when using https', function() {
        Runtime.getDocument.and.returnValue({
          location: {
            protocol: 'https:'
          }
        });
        let config = Config.getConfig({});
        expect(config.useTLS).toEqual(true);
      });
    }
  });

  it('should not set nacl on config if no nacl provided', function() {
    let config = Config.getConfig({});
    expect('nacl' in config).toEqual(false)
  });
  it('should set nacl on config if nacl provided', function() {
    let config = Config.getConfig({ nacl: nacl });
    expect(config.nacl).toEqual(nacl);
  });
});
function getStaticDefaultKeys() {
  return [
    'activityTimeout',
    'authEndpoint',
    'authTransport',
    'cluster',
    'httpPath',
    'httpPort',
    'httpsPort',
    'pongTimeout',
    'statsHost',
    'unavailableTimeout',
    'wsPath',
    'wsPort',
    'wssPort'
  ]
}
