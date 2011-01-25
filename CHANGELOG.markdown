# Changelog

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
