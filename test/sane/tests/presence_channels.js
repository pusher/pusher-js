;(function(context) {
  var withSubscribedPresenceChannel = function(callback) {
    Pusher.channel_auth_transport = 'ajax';
    Pusher.XHR = context.TestXHR;
    var channel = Pusher.Channel.factory('presence-channel', {}); // 1 channel connecting

    channel.bind('pusher_internal:authorized', function() { // 4 on authorized event
      channel.emit('pusher_internal:subscription_succeeded', { // 5 send sub succ event
        "presence": { "count": 1, "hash": { "6": { "a":"1" } } }
      });
    });

    channel.bind('pusher:subscription_succeeded', function(members) { // 6 on sub succ event
      callback(channel); // 7 run callback
    });

    fakeAuth( channel );
  };

  var fakeAuth = function( channel ) {
    var xhr = channel.authorize("1.1", {}, function(err, data) {}); // 2 auth channel
    TestXHR.lastInstance().trigger('DONE', { // 3 send auth response
      status: 200,
      responseText:JSON.stringify({
        "auth":"278d425bdf160c739803:a99e78e7cd40dcd0d4ae06be0a5395b6cd3c085764229fd40b39ce92c39af33e",
        "channel_data": "{ \"user_id\": \"6\", \"user_info\": { \"a\":\"1\" } }" // will come over wire as str
      })
    });
  };

  Tests.addSuite('Pusher.PresenceChannel', {
    'Members': {
      'instantiation': {
        'channel creation creates members obj': function(test) {
          test.ok(Pusher.Channel.factory('presence-channel', {}).members !== undefined);
          test.finish();
        },

        'count is 0': function(test) {
          test.equal(Pusher.Channel.factory('presence-channel', {}).members.count, 0);
          test.finish();
        },
      },

      'adding members': {
        'adds new member info and increments count': function(test) {
          var user_id = "7";
          var user_info = { "b":"1" };
          withSubscribedPresenceChannel(function(channel) {
            channel.bind("pusher_internal:member_added", function() {
              channel.members.each(function() {
                test.equal(channel.members.count, 2);
                test.deepEqual(channel.members.get(user_id), { id: user_id, info: user_info });
                test.finish();
              });
            });

            channel.emit("pusher_internal:member_added", {
              user_id: user_id, user_info: user_info
            });
          });
        },

        'id clash overwrites info': function(test) {
          var user_id = "7";
          var user_1_info = { "b":"1" };
          var user_2_info = { "c":"1" };
          withSubscribedPresenceChannel(function(channel) {
            // set user to be overwritten
            channel.emit("pusher_internal:member_added", {
              user_id: user_id, user_info: user_1_info
            });

            channel.bind("pusher:member_added", function() {
              channel.members.each(function() {
                test.deepEqual(channel.members.get(user_id), { id: user_id, info: user_2_info });
                test.equal(channel.members.count, 2);
                test.finish();
              });
            });

            channel.emit("pusher_internal:member_added", {
              user_id: user_id, user_info: user_2_info
            });
          });
        }
      },

      'removing members': {
        'removes member info and decrements count': function(test) {
          var user_id = "7";
          var user_info = { "b":"1" };
          withSubscribedPresenceChannel(function(channel) {
            channel.bind("pusher:member_removed", function() {
              var i = 0;
              channel.members.each(function() {
                i++;
                if(i == 2) {
                  test.ok(false, "should only have one member");
                }
              });

              setTimeout(function() {
                test.equal(channel.members.count, 1);
                test.finish();
              }, 500);
            });

            channel.emit("pusher_internal:member_added", {
              user_id: user_id, user_info: user_info
            });

            channel.emit("pusher_internal:member_removed", {
              user_id: user_id
            });
          });
        }
      },

      'me': {
        'returns undefined when initialised': function(test) {
          test.equal(Pusher.Channel.factory('presence-channel', {}).members.me, null);
          test.finish();
        },

        'returns user_id and user_info of local user when subscribed': function(test) {
          withSubscribedPresenceChannel(function(channel) {
            test.deepEqual(channel.members.me, { "id": "6", "info": { "a":"1" } });
            test.finish();
          });
        },

        'returns undefined when disconnected after subscribe': function(test) {
          withSubscribedPresenceChannel(function(channel) {
            channel.disconnect();
            test.deepEqual(channel.members.me, null);
            test.finish();
          });
        },
      },

      'each': {
        'passes user_id and user_info when running cb': function(test) {
          var channel = Pusher.Channel.factory('presence-channel', {});
          channel.members._members_map["0"] = { a:0 };
          channel.members._members_map["1"] = { a:1 };

          var i = 0;
          channel.members.each(function(data) {
            test.equal(data.id, i.toString());
            test.deepEqual(data.info, { a:i });
            i++;
            if(i === 2) {
              test.finish()
            }
          });
        },

        'runs callbacks on all members': function(test) {
          var channel = Pusher.Channel.factory('presence-channel', {});
          channel.members._members_map["a"] = {};
          channel.members._members_map["b"] = {};
          channel.members._members_map["c"] = {};

          var cbsRun = 0;
          channel.members.each(function() {
            cbsRun++;
            if(cbsRun === 3) {
              test.finish();
            }
          });
        },

        'just after channel creation, no members to iterate': function(test) {
          Pusher.Channel.factory('presence-channel', {}).members.each(function() {
            test.ok(false, "should not have any members");
          });

          setTimeout(function() {
            test.finish();
          }, 500); // gross, I know
        }
      },

      'get': {
        'returns obj of user_id and user_info': function(test) {
          var channel = Pusher.Channel.factory('presence-channel', {});
          channel.members._members_map["0"] = { a:0 };
          test.deepEqual(channel.members.get("0"), { id:"0", info: { a: 0 } });
          test.finish();
        },

        'returns null for non-existence user_id': function(test) {
          var channel = Pusher.Channel.factory('presence-channel', {});
          test.equal(channel.members.get("hellno"), null);
          test.finish();
        }
      }
    },

    'subscription': {
      'get subscribed': function(test) {
        withSubscribedPresenceChannel(function() {
          test.finish();
        });
      },

      'subscribed set to false after disconnection': function(test) {
        withSubscribedPresenceChannel(function(channel) {
          channel.disconnect();
          test.equal(channel.subscribed, false);
          test.finish();
        });
      },

      'pusher_internal:subscription_succeeded triggers pusher:subscription_succeeded callback': function( test ) {
        Pusher.channel_auth_transport = 'ajax';
        Pusher.XHR = context.TestXHR;
        var channel = Pusher.Channel.factory('presence-channel', {}); // 1 channel connecting

        channel.bind('pusher_internal:authorized', function() { // 4 on authorized event
          channel.emit('pusher_internal:subscription_succeeded', { // 5 send sub succ event
            "presence": { "count": 1, "hash": { "6": { "a":"1" } } }
          });
        });

        var callbackCount = 0
        channel.bind('pusher:subscription_succeeded', function(members) { // 6 on sub succ event
          ++callbackCount;
        });

        test.equal( callbackCount, 0 );

        fakeAuth( channel );

        test.equal( callbackCount, 1 );

        test.finish( channel );
      },

      'pusher_internal:subscription_succeeded triggers pusher:subscription_succeeded callback once upon reconnection': function( test ) {
        Pusher.channel_auth_transport = 'ajax';
        Pusher.XHR = context.TestXHR;
        var channel = Pusher.Channel.factory('presence-channel', {}); // 1 channel connecting

        channel.bind('pusher_internal:authorized', function() { // 4 on authorized event
          channel.emit('pusher_internal:subscription_succeeded', { // 5 send sub succ event
            "presence": { "count": 1, "hash": { "6": { "a":"1" } } }
          });
        });

        var callbackCount = 0
        channel.bind('pusher:subscription_succeeded', function(members) { // 6 on sub succ event
          ++callbackCount;
        });

        test.equal( callbackCount, 0 );

        fakeAuth( channel );

        test.equal( callbackCount, 1 );

        channel.disconnect();

        fakeAuth( channel );

        test.equal( callbackCount, 2 );

        test.finish();
      }

    }
  });
})(this);
