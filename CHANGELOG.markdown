# Changelog

## 1.9.6 (2011-11-16)

[FIXED] Issue in Mozilla Firefox 8, where making a connection to non-ssl websocket endpoint from a secure page results in a security exception.

## 1.9.5 (2011-11-15)

[FIXED] NetInfo listening as to not clobber the window.ononline and window.onoffline variables. Fixes issue #9.

[FIXED] Loading of web-socket-js on Mozilla browsers with MozWebSocket, issue #10.

[UPGRADE] Test framework to run in most browsers (IE6+, FF3+, Opera 11.52+, Safari, Chrome). Includes various other improvements to tests and testing infrastructure.

[NEW] Smarter SSL only error detection. If a connection is closed by pusher with an error saying that the app is in SSL only mode, then we will now force all future connection attempts to use SSL.

[NEW] Added guards around the JSON.parse calls in the Ajax Authoriser for private and presence channels.

## 1.9.4 (2011-09-12)

[FIX] Fixed bug which meant that presence channels only worked correctly when `user_info` was supplied. It's now possible to use presence channels without specifying `user_info` (`user_id` is required).

## 1.9.3 (2011-08-19)

[FIX] Fixed JSON dependency loading properly, rather than bundling it always.

## 1.9.2 (2011-08-04)

[NEW] Cleverer reconnection behaviour.

If Connection is connected and the window.ononffline event is fired, this indicates that the computer has lost its connection to the local router.  In response, the Connection immediately closes the socket.

If Connection is disconnected and waiting to reattempt a connection, and the window.ononline event is fired, the Connection tries to connect immediately, rather than waiting for the current waiting period to elapse.

If the window is about to attempt a connection and the window.navigator.onLine variable is false, the Connection immediately goes to the unavailable state.

Note: window.ononline, window.onoffline and window.navigator.onLine are only supported by some browsers.

[NEW] If channel authentication AJAX request returns a status code that is not 200, a `subscription_error` event is triggered.  The `subscription_error` can be bound to so that the library user can respond to the failure.

[FIX] Works with IE7 again, after being broken in 1.9.0.

[FIX] Traffic Light connection status demo works in installations of Firefox 3.6 without Firebug.

## 1.9.1 (2011-07-18)

[FIX] Client events triggering fixed (broken by 1.9.0)

[FIX] Removed verbose logging of internal state machine transitions

## 1.9.0 (2011-07-15)

[NEW] New API to allow binding to changes in connection state. See blog post for details.

[NEW] Support for Firefox 6 native WebSocket using MozWebSocket prefix

[REMOVED] Old connection state events: `pusher:connection_established`, `pusher:connection_failed`, `pusher:connection_disconnected`.

[CHANGED] Socket id now accessed via `pusher.connection.socket_id` rather than `pusher.socket_id`.

## 1.8.6 (2011-08-19)

[NEW] Support for Firefox 6 native WebSocket using MozWebSocket prefix

## 1.8.5 (2011-06-18)

[FIX] Fix the fact that member was being added to the global scope

[CHANGE] `Pusher.log` function now always receives a single string argument rather than multiple arguments, making it easier to use. If you want more control, you can over-ride `Pusher.debug`

## 1.8.4 (2011-06-18)

[FIX] When using multiple presence channels concurrently, the members object for each channel now operates as expected

## 1.8.3 (2011-04-19)

[FIX] Delay Pusher initialization until document.body is defined. This fixes an issue in Firefox < 4 & IE which occasionally caused a "document.body is null"  error when loading the flash fallback.

[UPGRADE] Upgraded linked version of web-socket-js. Amongst other things this removes the dependency on FABridge and reduces the minified size of fallback dependencies by 13KB.
For the full list of changes in web-socket-js see <https://github.com/gimite/web-socket-js/compare/6640d9d806972ea1720a273d09e8919464bcd131...bb5797cad5244dc86410e35726ef886bbc49afe9>

## 1.8.2 (2011-03-29)

[BUGFIX] When loaded onto a HTTPS page, load pusher dependencies from HTTPS.

## 1.8.1 (2011-03-21)

[BUGFIX] Minor fix which could have allowed `member_removed` to be triggered with nil.

[CHANGE] Increased default connection timeout to reduce likelyhood of timeouts on first connection attempt. This is now configurable as `Pusher.connection_timeout`.

## 1.8.0 (2011-02-10)

[NEW] Support triggering client events with new API

    channel.trigger('client-myeventname', {
      some: 'data'
    })

[NEW] Support for new socket presence interface, and changed javascript API. The `subscription_succeeded` event now returns an iterator object:

    presence_channel.bind('pusher:subscription_succeeded', function(members) {
     members.each(function(member) {
       console.log(member.id, member.info)
     })
    })

Also, the member object passed to `member_added` and `member_removed` now has attributes `id` and `info` rather than `user_id` and `user_info`.

[CHANGED] Improved javascript debug console logging.

## 1.7.6 (2011-03-29)

[BUGFIX] When loaded onto a HTTPS page, load pusher dependencies from HTTPS [backported from 1.8.2].

## 1.7.5 (2011-03-21)

[CHANGE] Increased default connection timeout to reduce likelyhood of timeouts on first connection attempt. This is now configurable as `Pusher.connection_timeout` [backported from 1.8.1].

## 1.7.4 (2011-02-09)

[FIXED] Javascript error was raised in the case that neither native WebSockets nor Flash were available.

[FIXED] Updated linked version of web-socket-js, which fixes issue connecting from Android, allows connection attempts to timeout and retry correctly. For full details see <https://github.com/gimite/web-socket-js/compare/2776dcfbf7847a5e19505432d8d63f8814e37b52...6640d9d806972ea1720a273d09e8919464bcd131>

## 1.7.3 (2011-02-01)

[FIXED] Pusher could fail to initialize in IE 7 & 8 when dependencies cached

## 1.7.2 (2011-01-25)

[FIXED] pusher.min.js now loads minified rather than unminified dependencies.

[CHANGED] Using JBundle for bundling the distribution. This should not in any way affect the minified files, it just simplifies building them.

## 1.7.1

Wrap timeout around connections so that silently hanging connections are retried.

More robust reconnection logic, with initially shorter reconnect delay, but with increasing backoff.

## 1.7.0

Encrypted apps: apps can now be configured to connect via SSL only. There is a corresponding setting in your dashboard which will reject non encrypted connections.

    var pusher = new Pusher('your-key', {
      encrypted: true
    })

Note that the second argument to the Pusher constructor for setting channel names has been removed. You should use `pusher.subscribe instead`. THIS NO LONGER WORKS:

    var pusher = new Pusher('your-key', 'channel-name') # DOES NOT WORK

## 1.6.4

JSONp support for presence and private channels

Configurable transport for channel auths. JSONp allows for cross-domain channel authorization (ie. embedable widgets)

    Pusher.channel_auth_transport = 'jsonp';

The default is Ajax for backwards compatibility. Ajax mode POSTS to Pusher.channel_auth_endpoint, whereas JSONp GETs.

For JSONp to work, your server must wrap the response in the callback name provided as a query parameter. Ruby example (using Pusher Gem) and Rails:

    auth = Pusher[channel_name].authenticate(params[:socket_id], {
      :user_id => current_user.id,
      :user_info => {:name => current_user.name}
    })

    render :text => params[:callback] + "(" + JSON.generate(auth) + ");"

## 1.6.3

Fixed presence bug for removed duplicate members.

If I connect as the same user in different browser windows or tabs, clients should trigger remove that member from a channel's member list only when the last window/tab is closed.

See http://pusher.tenderapp.com/discussions/questions/11-presence-of-friends for discussion.

## 1.6.2

Dynamically load Javascript and Flash dependencies only for browsers that need them. Including pusher.js will:

IE: require JSON2, require and activate Flash fallback.
Firefox 3.6x: require and activate Flash fallback
Chrome, Safari: don't require anything. These browsers already have WebSocket and JSON support.

This saves a lot of bandwidth and makes page loads faster.

## 1.6

Initial Presence support. Subscribing to presence channels allows you to respond to people entering and leaving the channel in your UI, to show who is has a connection open. More documentation here: http://pusherapp.com/docs/presence.

## 1.5

Updated the library to use a version of the swf file hosted by Pusher. This makes it more convenient to integrate and avoids version conflicts in future.

Add some full-stack integration tests that interact with the production Pusher environment.

## 1.4.3

Trigger pusher:connection\_failed if no websocket is defined, allowing the event to work on iphones etc.

## 1.4.2

 * Removed switch\_to\_secure and switch\_to\_unsecure in favour of automatic failover to ssl
 * Generate internal events pusher:connection\_disconnected and pusher:connection\_failed
 * Responds to pusher:connection\_established preparing for deprecation of connection\_established

## 1.4.1

Added switch\_to\_secure() and switch\_to\_unsecure() to enable ssl testing

## 1.4

Add ability to bind events to a specific channel:

    var server = new Pusher("API_KEY", "my-channel")
    server.channel("my-channel").bind("my-event", function(data) {
      // do something
    })

## 1.3

Add support for subscribing to private channels. Retrieves an authentication string via Ajax from your server - for more information view the docs: <http://pusherapp.com/docs/private_channels>

## 1.2.1

Basic support for subscribing to multiple channels:

    var server = new Pusher("API_KEY", "my-channel")
    server.subscribe("another-channel")
    server.unsubscribe("my-channel")

## 1.2

Build a single Javascript file including all dependencies for Flash fallback and browsers that don't have a native JSON implementation.

## 1

First release!
