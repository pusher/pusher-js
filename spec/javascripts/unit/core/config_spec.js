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
    let _getAuthorizers;
    let transportAuthorizer;
    let transportAuthorizer2;
    let transportAuthorizerAjax;

    beforeAll(function() {
      _getAuthorizers = Runtime.getAuthorizers;
    });

    afterAll(function() {
      Runtime.getAuthorizers = _getAuthorizers;
    });

    beforeEach(function() {
      transportAuthorizer = jasmine.createSpy("some-auth-transport")
      transportAuthorizer2 = jasmine.createSpy("some-auth-transport2")
      transportAuthorizerAjax = jasmine.createSpy("ajax")
      Runtime.getAuthorizers = jasmine.createSpy("getAuthorizers").and.returnValue({
        'some-auth-transport': transportAuthorizer,
        'some-auth-transport2': transportAuthorizer2,

        // When we test channelAuthorizer, the userAuthenticator will be using
        // the default ajax transport and vice versa.
        'ajax': transportAuthorizerAjax,
      });
    });

    it('should use deprecated auth options', function() {
      let opts = {
        authTransport: 'some-auth-transport',
        authEndpoint: '/pusher/spec/auth',
        auth: {
          params: { foo: 'bar' },
          headers: { spec: 'header' }
        },
      };
      const pusher = {};
      let config = Config.getConfig(opts, pusher);

      let callback = function(){};
      config.channelAuthorizer({
        socketId: '1.23',
        channelName: 'private-test',
      }, callback);

      authOptions = {
        transport: 'some-auth-transport',
        endpoint: '/pusher/spec/auth',
        params: { foo: 'bar' },
        headers: { spec: 'header' }
      }
      const query = 'socket_id=1.23&channel_name=private-test&foo=bar';
      expect(transportAuthorizer.calls.count()).toEqual(1);
      expect(transportAuthorizer).toHaveBeenCalledWith(
        Runtime,
        query,
        authOptions,
        "channel-authorization",
        callback
      );
    })

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

    it('should use channelAuthorization and override deprecated auth options', function() {
      let opts = {
        authTransport: 'some-auth-transport',
        authEndpoint: '/pusher/spec/auth',
        auth: {
          params: { foo: 'bar' },
          headers: { spec: 'header' }
        },
        channelAuthorization: {
          transport: 'some-auth-transport2',
          endpoint: '/pusher/spec/auth2',
          params: { spec2: 'param2' },
          headers: { spec2: 'header2' }
        }
      };
      const pusher = {};
      let config = Config.getConfig(opts, pusher);
      let callback = function(){};
      config.channelAuthorizer({
        socketId: '1.23',
        channelName: 'private-test',
      }, callback);

      console.log(config);
      authOptions = {
        transport: 'some-auth-transport2',
        endpoint: '/pusher/spec/auth2',
        params: { spec2: 'param2' },
        headers: { spec2: 'header2' }
      }
      const query = 'socket_id=1.23&channel_name=private-test&spec2=param2';
      expect(transportAuthorizer.calls.count()).toEqual(0);
      expect(transportAuthorizer2.calls.count()).toEqual(1);
      expect(transportAuthorizer2).toHaveBeenCalledWith(
        Runtime,
        query,
        authOptions,
        "channel-authorization",
        callback
      );
    });

    it('should use default transport when not provided in channelAuthorization', function() {
      let opts = {
        authEndpoint: '/pusher/spec/auth',
        auth: {
          params: { foo: 'bar' },
          headers: { spec: 'header' }
        },
        channelAuthorization: {
          endpoint: '/pusher/spec/auth2',
          params: { spec2: 'param2' },
          headers: { spec2: 'header2' }
        }
      };
      const pusher = {};
      let config = Config.getConfig(opts, pusher);
      let callback = function(){};
      config.channelAuthorizer({
        socketId: '1.23',
        channelName: 'private-test',
      }, callback);

      authOptions = {
        transport: 'ajax',
        endpoint: '/pusher/spec/auth2',
        params: { spec2: 'param2' },
        headers: { spec2: 'header2' }
      }
      const query = 'socket_id=1.23&channel_name=private-test&spec2=param2';
      expect(transportAuthorizer.calls.count()).toEqual(0);
      expect(transportAuthorizer2.calls.count()).toEqual(0);
      expect(transportAuthorizerAjax.calls.count()).toEqual(1);
      expect(transportAuthorizerAjax).toHaveBeenCalledWith(
        Runtime,
        query,
        authOptions,
        "channel-authorization",
        callback
      );
    });


    it('should use customerHandler inside channelAuthorization', function() {
      const customHandler = jasmine.createSpy('customHandler');
      let opts = {
        channelAuthorization: {
          transport: 'some-auth-transport',
          endpoint: '/pusher/spec/auth',
          params: { spec: 'param' },
          headers: { spec: 'header' },
          customHandler: customHandler
        }
      };

      const pusher = {};
      let config = Config.getConfig(opts, pusher);
      expect(config.channelAuthorizer).toEqual(customHandler);
    });

    it('should have default options for user authentication', function() {
      let opts = {};

      const pusher = {};
      let config = Config.getConfig(opts, pusher);
      let callback = function(){};
      config.userAuthenticator({
        socketId: '1.23',
      }, callback);

      authOptions = {
        transport: 'ajax',
        endpoint: '/pusher/user-auth',
      }
      const query = 'socket_id=1.23';
      expect(transportAuthorizerAjax.calls.count()).toEqual(1);
      expect(transportAuthorizerAjax).toHaveBeenCalledWith(
        Runtime,
        query,
        authOptions,
        "user-authentication",
        callback
      );
    });

    it('should use userAuthentication options for user authentication', function() {
      let opts = {
        userAuthentication: {
          transport: 'some-auth-transport',
          endpoint: '/pusher/spec/auth',
          params: { foo: 'bar' },
          headers: { spec: 'header' }
        }
      };

      const pusher = {};
      let config = Config.getConfig(opts, pusher);
      let callback = function(){};
      config.userAuthenticator({
        socketId: '1.23',
      }, callback);

      authOptions = {
        transport: 'some-auth-transport',
        endpoint: '/pusher/spec/auth',
        params: { foo: 'bar' },
        headers: { spec: 'header' }
      }
      const query = 'socket_id=1.23&foo=bar';
      expect(transportAuthorizer.calls.count()).toEqual(1);
      expect(transportAuthorizer).toHaveBeenCalledWith(
        Runtime,
        query,
        authOptions,
        "user-authentication",
        callback
      );
    });

    it('should use default transport when not provided in userAuthentication', function() {
      let opts = {
        userAuthentication: {
          endpoint: '/pusher/spec/auth',
          params: { foo: 'bar' },
          headers: { spec: 'header' }
        }
      };

      const pusher = {};
      let config = Config.getConfig(opts, pusher);
      let callback = function(){};
      config.userAuthenticator({
        socketId: '1.23',
      }, callback);

      authOptions = {
        transport: 'ajax',
        endpoint: '/pusher/spec/auth',
        params: { foo: 'bar' },
        headers: { spec: 'header' }
      }
      const query = 'socket_id=1.23&foo=bar';
      expect(transportAuthorizer.calls.count()).toEqual(0);
      expect(transportAuthorizer2.calls.count()).toEqual(0);
      expect(transportAuthorizerAjax.calls.count()).toEqual(1);
      expect(transportAuthorizerAjax).toHaveBeenCalledWith(
        Runtime,
        query,
        authOptions,
        "user-authentication",
        callback
      );
    });

    it('should use customHandler inside userAuthentication', function() {
      const customHandler = jasmine.createSpy('customHandler');
      let opts = {
        userAuthentication: {
          transport: 'some-auth-transport',
          endpoint: '/pusher/spec/auth',
          params: { spec: 'param' },
          headers: { spec: 'header' },
          customHandler: customHandler
        }
      };

      const pusher = {};
      let config = Config.getConfig(opts, pusher);
      expect(config.userAuthenticator).toEqual(customHandler);
    });
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
