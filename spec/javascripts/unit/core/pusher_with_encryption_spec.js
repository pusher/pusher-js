var Pusher = require('core/pusher').default;
var PusherWithEncryption = require('core/pusher-with-encryption').default;

describe('PusherWithEncryption', function() {
  it('should pass logToConsole config to parent class', function() {
    PusherWithEncryption.logToConsole = true;
    let pusher = new PusherWithEncryption('key');
    expect(Pusher.logToConsole).toEqual(true);
  });
  it('should pass log function to parent class', function() {
    let logFn =  jasmine.createSpy('logFn');
    PusherWithEncryption.log = logFn
    let pusher = new PusherWithEncryption('key');
    expect(logFn).toHaveBeenCalled();
  });
});
