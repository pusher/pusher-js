var TestEnv = require('testenv');
var Config = require('core/config');
var Defaults = require('core/defaults').default;
var Runtime = require('runtime').default;
var nacl = require('tweetnacl')

describe('Config', function() {
  beforeEach(function() {
    if (TestEnv === 'web') {
      spyOn(Runtime, 'getDocument').andReturn({
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
      authorizer: () => {},
      authTransport: 'some-auth-transport',
      authEndpoint: '/pusher/spec/auth',
      auth: {
        params: { spec: 'param' },
        headers: { spec: 'header' }
      },
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
        Runtime.getDocument.andReturn({
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
