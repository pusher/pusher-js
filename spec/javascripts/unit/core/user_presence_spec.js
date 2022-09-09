var UserPresenceFacade = require("core/user_presence").default;

fdescribe("UserPresenceFacade", function () {
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

  describe('#bind', function() {
    var userPresenceFacade;

    beforeEach(function() {
      userPresenceFacade = new UserPresenceFacade(pusher);
    });

    it('should add the listener to a specific event', function() {
      const eventName = 'online'
      const eventData = { action: eventName, user_ids: ['1'] };

      var onEvent = jasmine.createSpy('onEvent');
      userPresenceFacade.bind(eventName, onEvent);
      userPresenceFacade.emit(eventName, eventData);

      expect(onEvent).toHaveBeenCalledWith(eventData);
    });

    it('should add the listener to online-status events', function() {
      const eventName = 'online-status'

      var onEvent = jasmine.createSpy('onEvent');
      userPresenceFacade.bind(eventName, onEvent);

      ['online', 'offline', 'subscribe'].forEach(function(eventName, index) {
        const eventData = { action: eventName, user_ids: [`${index}`] }
        userPresenceFacade.emit(eventName, eventData);
      })

      expect(onEvent).toHaveBeenCalledTimes(2);
      expect(onEvent).toHaveBeenCalledWith({ action: 'online', user_ids: ['0'] });
      expect(onEvent).toHaveBeenCalledWith({ action: 'offline', user_ids: ['1'] });
    });

    it('should add the listener to channel-subscription events', function() {
      const eventName = 'channel-subscription'

      var onEvent = jasmine.createSpy('onEvent');
      userPresenceFacade.bind(eventName, onEvent);

      ['subscribe', 'unsubscribe', 'online'].forEach(function(eventName, index) {
        const eventData = { action: eventName, user_ids: [`${index}`] }
        userPresenceFacade.emit(eventName, eventData);
      });

      expect(onEvent).toHaveBeenCalledTimes(2);
      expect(onEvent).toHaveBeenCalledWith({ action: 'subscribe', user_ids: ['0'] });
      expect(onEvent).toHaveBeenCalledWith({ action: 'unsubscribe', user_ids: ['1'] });
    });
  });
});
