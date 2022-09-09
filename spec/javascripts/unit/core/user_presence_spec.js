var UserPresenceFacade = require("core/user_presence").default;

describe("UserPresenceFacade", function () {
  var connection;
  var pusher;

  beforeEach(function() {
    connection = jasmine.createSpy('connection');
    pusher = jasmine.createSpy('pusher');
    pusher.connection = connection;

    spyOn(pusher.connection, 'bind')
  });

  it('should bind to pusher_internal:user_presence events', function() {
    new UserPresenceFacade(pusher);
    expect(connection.bind).toHaveBeenCalledWith('message', jasmine.any(Function));
  });

  describe('#handleEvent', function() {
    var userPresenceFacade;

    beforeEach(function() {
      userPresenceFacade = new UserPresenceFacade(pusher);
    });

    const userPresenceEvents = [
      { action: 'online', user_ids: ['1'] },
      { action: 'offline', user_ids: ['2', '3', '4'] },
      { action: 'subscribe', user_ids: ['5', '6'], channel_name: 'presence-chat' }
    ];

    it(`should emit ${userPresenceEvents.length} events`, function() {
      const pusherEvent = {
        event: 'pusher_internal:user_presence',
        data: { events: userPresenceEvents }
      };

      spyOn(userPresenceFacade, 'emit').and.callThrough();
      userPresenceFacade.handleEvent(pusherEvent);
      
      expect(userPresenceFacade.emit).toHaveBeenCalledTimes(userPresenceEvents.length)
      userPresenceEvents.forEach(function(event) {
        expect(userPresenceFacade.emit).toHaveBeenCalledWith(event.action, event);
      });
    });
  })
});
