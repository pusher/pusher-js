var Pusher = require('core/pusher').default;
var PusherWithEncryption = require('core/pusher-with-encryption').default;

describe('PusherWithEncryption', function() {
  it('should pass logToConsole config to parent class', function() {
    PusherWithEncryption.logToConsole = true;
    let pusher = new PusherWithEncryption('key', {cluster: "mt1"});
    expect(Pusher.logToConsole).toEqual(true);
  });
  it('should pass log function to parent class', function() {
    let _prevLog = PusherWithEncryption.log
    let logFn =  jasmine.createSpy('logFn');
    PusherWithEncryption.log = logFn
    let pusher = new PusherWithEncryption('key', {cluster: "mt1"});
    expect(logFn).toHaveBeenCalled();
    PusherWithEncryption.log = _prevLog
  });
});
