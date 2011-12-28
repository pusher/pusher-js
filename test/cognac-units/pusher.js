;(function(){
  Pusher.NetInfo = TestNetInfo;

  runner.addSuite('Pusher', {
    'Instantiation': {
      'App key': {
        'No key supplied': [
          function(test) {
            var logs = new mock.log.LogMock();
            var pusher = new Pusher();
            test.equal(logs.messages["Warning"][0],
                       "Pusher : Warning : You must pass your app key when you instantiate Pusher.",
                       "User should be warned if they do not supply an app key");
            test.finish();
          },

          function(test) {
            new mock.log.LogMock().restore();
            test.finish();
          }
        ],

        'Key supplied': [
          function(test) {
            var logs = new mock.log.LogMock();
            var pusher = new Pusher("abc");

            test.equal(logs.messages["Warning"], undefined, "No warning if app key supplied.");
            test.finish();
          },

          function(test) {
            new mock.log.LogMock().restore();
            test.finish();
          }
        ]
      }
    }
  });
})();