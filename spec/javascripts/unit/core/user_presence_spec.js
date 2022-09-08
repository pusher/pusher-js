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
      { action: 'online', users: ['1'] },
      { action: 'offline', users: ['2', '3', '4'] },
      { action: 'subscribed', users: ['5', '6'], channel_name: 'presence-chat' }
    ];

    it(`should emit ${userPresenceEvents.length} events`, function() {
      const pusherEvent = {
        event: 'pusher_internal:user_presence',
        data: { events: userPresenceEvents }
      };

      spyOn(userPresenceFacade, 'emit').and.callThrough();
      userPresenceFacade.handleEvent(pusherEvent);
      
      expect(userPresenceFacade.emit).toHaveBeenCalledTimes(userPresenceEvents.length)
    });
  })

  describe('#bind', function() {
    var userPresenceFacade;

    beforeEach(function() {
      userPresenceFacade = new UserPresenceFacade(pusher);
    });

    it('should add the listener to a specific event', function() {
      const eventName = 'online'
      const eventData = { action: eventName, users: ['1'] };

      var onEvent = jasmine.createSpy('onEvent');
      userPresenceFacade.bind(eventName, onEvent);
      userPresenceFacade.emit(eventName, eventData);

      expect(onEvent).toHaveBeenCalledWith(eventData);
    });

    it('should add the listener to a list of events', function() {
      const events = ['online', 'offline'];
      var onEvent = jasmine.createSpy('onEvent');

      userPresenceFacade.bind(events, onEvent);

      events.forEach(function(eventName, index) {
        const eventData = { action: eventName, users: [index] }
        userPresenceFacade.emit(eventName, eventData);
      })

      expect(onEvent).toHaveBeenCalledTimes(2);
    });

    it('should add the listener to online-status events', function() {
      const eventName = 'online-status'

      var onEvent = jasmine.createSpy('onEvent');
      userPresenceFacade.bind(eventName, onEvent);

      ['online', 'offline', 'subscribed'].forEach(function(eventName, index) {
        const eventData = { action: eventName, users: [index] }
        userPresenceFacade.emit(eventName, eventData);
      })

      expect(onEvent).toHaveBeenCalledTimes(2);
    });

    it('should add the listener to channel-subscription events', function() {
      const eventName = 'channel-subscription'

      var onEvent = jasmine.createSpy('onEvent');
      userPresenceFacade.bind(eventName, onEvent);

      ['subscribed', 'unsubscribed', 'online'].forEach(function(eventName, index) {
        const eventData = { action: eventName, users: [index] }
        userPresenceFacade.emit(eventName, eventData);
      });

      expect(onEvent).toHaveBeenCalledTimes(2);
    });
  });
});
