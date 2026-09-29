// Regression test for https://github.com/pusher/pusher-js/issues/982
// Verifies that the React Native bundle default export is the Pusher constructor directly,
// not wrapped in an object ({ Pusher: PusherClass }), as fixed for the Node bundle in #935.
var Module = require('module');

describe("React Native bundle export shape", function() {
  var Pusher;

  beforeAll(function() {
    // The bundle requires @react-native-community/netinfo when it loads, and the real
    // module needs a React Native runtime, so serve a stub from the require cache.
    var netInfoPath = require.resolve('@react-native-community/netinfo');
    var netInfoStub = new Module(netInfoPath);
    netInfoStub.loaded = true;
    netInfoStub.exports = {
      fetch: function() { return Promise.resolve({ type: 'wifi' }); },
      addEventListener: function() { return function() {}; }
    };
    require.cache[netInfoPath] = netInfoStub;

    Pusher = require('../../../../dist/react-native/pusher.js');
  });

  it("should export the Pusher constructor as the default export", function() {
    expect(typeof Pusher).toBe("function");
  });

  it("should not wrap the constructor in an object", function() {
    expect(typeof Pusher.Pusher).toBe("undefined");
  });

  it("should be instantiable with new", function() {
    expect(function() { Pusher.prototype; }).not.toThrow();
  });
});
