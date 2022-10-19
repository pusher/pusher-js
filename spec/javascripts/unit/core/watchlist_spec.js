var WatchlistFacade = require("core/watchlist").default;

describe("WatchlistFacade", function () {
  var connection;
  var pusher;

  beforeEach(function() {
    connection = jasmine.createSpy('connection');
    pusher = jasmine.createSpy('pusher');
    pusher.connection = connection;

    spyOn(pusher.connection, 'bind')
  });

  it('should bind to pusher_internal:user_presence events', function() {
    new WatchlistFacade(pusher);
    expect(connection.bind).toHaveBeenCalledWith('message', jasmine.any(Function));
  });

  describe('#handleEvent', function() {
    var watchlistFacade;

    beforeEach(function() {
      watchlistFacade = new WatchlistFacade(pusher);
    });

    const watchlistEvents = [
      { name: 'online', user_ids: ['1'] },
      { name: 'offline', user_ids: ['2', '3', '4'] },
      { name: 'subscribe', user_ids: ['5', '6'], channel_name: 'presence-chat' }
    ];

    it(`should emit ${watchlistEvents.length} events`, function() {
      const pusherEvent = {
        event: 'pusher_internal:watchlist_events',
        data: { events: watchlistEvents }
      };

      spyOn(watchlistFacade, 'emit').and.callThrough();
      watchlistFacade.handleEvent(pusherEvent);
      
      expect(watchlistFacade.emit).toHaveBeenCalledTimes(watchlistEvents.length)
      watchlistEvents.forEach(function(event) {
        expect(watchlistFacade.emit).toHaveBeenCalledWith(event.name, event);
      });
    });
  })
});
