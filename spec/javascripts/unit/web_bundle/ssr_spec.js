// Requires the built web bundles in Node, where window and document are
// undefined, as an SSR render would. Importing, constructing, connecting and
// disconnecting must not throw. With no browser transports available,
// connect() should end in the failed state instead.
describe('Web bundle in Node/SSR', function () {
  var bundles = [
    'dist/web/pusher.js',
    'dist/web/pusher.min.js',
    'dist/web/pusher-with-encryption.js',
    'dist/web/pusher-with-encryption.min.js',
  ];

  bundles.forEach(function (bundle) {
    describe(bundle, function () {
      var Pusher;

      beforeAll(function () {
        expect(typeof window).toBe('undefined');
        Pusher = require('../../../../' + bundle);
      });

      it('should construct, connect and disconnect without throwing', function () {
        var pusher = new Pusher('key', { cluster: 'mt1' });
        expect(function () {
          pusher.connect();
        }).not.toThrow();
        expect(pusher.connection.state).toBe('failed');
        expect(function () {
          pusher.disconnect();
        }).not.toThrow();
      });
    });
  });
});
