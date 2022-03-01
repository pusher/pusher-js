var Pusher = require('core/pusher').default;
var Mocks = require('../../helpers/mocks');
var Runtime = require('runtime').default;
const Network = require('net_info').Network;
const waitsFor = require('../../helpers/waitsFor');
var Logger = require('core/logger').default;

describe('Pusher connected', function() {
  describe('pusher:signin_success', function() {
    var pusher;
    var transport;

    beforeEach(async function() {
      spyOn(Network, 'isOnline').and.returnValue(true);
      spyOn(Runtime, 'getLocalStorage').and.returnValue({});

      var Transports = Runtime.Transports;
      function createConnection() {
        transport = Mocks.getWorkingTransport();
        return transport;
      }
      spyOn(Transports.xhr_polling, 'createConnection').and.callFake(
        createConnection
      );
      spyOn(Transports.xhr_polling, 'isSupported').and.returnValue(true);
      pusher = new Pusher('foobar', {
        enabledTransports: ['xhr_polling']
      });
      pusher.connect();
      await waitsFor(
        function() {
          return pusher.connection.state === 'connected';
        },
        'pusher.connection.state to be connected',
        500
      );
    });

    describe('pusher:signin_success', function() {
      it('should process pusher:signin_success', async function() {
        transport.emit('message', {
          data: JSON.stringify({
            event: 'pusher:signin_success',
            data: {
              user_data: JSON.stringify({ id: '1', name: 'test' })
            }
          })
        });

        expect(pusher.user.user_data).toEqual({ id: '1', name: 'test' });
      });

      it('should log warning if user_data is not JSON', async function() {
        spyOn(Logger, 'error');
        transport.emit('message', {
          data: JSON.stringify({
            event: 'pusher:signin_success',
            data: {
              user_data: "I'm not JSON"
            }
          })
        });
        expect(Logger.error).toHaveBeenCalledWith(
          "Failed parsing user data after signin: I'm not JSON"
        );
        expect(pusher.user.user_data).toEqual(null);
      });
    });
  });
});
