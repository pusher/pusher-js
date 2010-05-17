# Pusher Javascript Client

This library is an open source client that allows Javascript clients to connect to the [Pusher webservice](http://pusherapp.com/). It is highly recommended that you use the hosted version of this file to stay up to date with the latest updates.

We have included with this library the source code for the websocket-js library with it own licensing.

## Usage overview

The following topics are covered:

* Configuration
* Connection
* Socket ids
* Subscribing to channels (public and private)
* Binding to events
  * Globally
  * Per-channel
* Default events

## Configuration

There are a number of variables which can be set for the Pusher client. For most users, there is little need to change these.

### `Pusher.host`

This can be changed to point to alternative Pusher URLs (used internally for our staging server).

### `Pusher.auth_url`

Endpoint on your server that will return the authentication signature needed for private channels.

## Connection

A websocket (or Flash Fallback) connection is established by providing your API key to the constructor function:

    var socket = new Pusher(API_KEY);

This returns a socket object which can then be used to subscribe to channels.
A channel name, or selection of channel names can be supplied at this point for auto-subscription:

    var socket = new Pusher(API_KEY, channel_name);

### Socket IDs

Making a connection provides the client with a new `socket_id` that is assigned by the server. This can be used to distinguish the client's own events. A change of state might otherwise be duplicated in the client. More information on this pattern is available [here](http://pusherapp.com/docs/duplicates).

It is also stored within the socket, and used as a token for generating signatures for private channels.

## Subscribing to channels

### Public channels

The default method for subscribing to a channel involves invoking the `subscribe` method of your socket object:

    var my_channel = socket.subscribe('my-channel');

This returns a Channel object which events can be bound to.

### Private channels

Private channels are created in exactly the same way as normal channels, except that they reside in the 'private-' namespace. This means prefixing the channel name:

    var my_channel = socket.subscribe('private-my-channel');

It is possible to access channels by name, through the `channel` function:

    channel = socket.channel('private-my-channel');

## Binding to events

Events can be bound to at 2 levels, the global, and per channel. They take a very similar form to the way events are handled in jQuery.

### Global events

You can attach behaviour to these events regardless of the channel the event is broadcast to. The following is an example of an app that binds to new comments from any channel:

    var socket = new Pusher('MY_API_KEY', 'my-channel');
    socket.bind('new-comment',
      function(data) {
        // add comment into page
      }
    );

### Per-channel events

These are bound to a specific channel, and mean that you can reuse event names in different parts of you client application. The following might be an example of a stock tracking app where several channels are opened for different companies:

    var socket = new Pusher('MY_API_KEY');
    var channel = socket.subscribe('APPL');
    channel.bind('new-price',
      function(data) {
        // add new price into the APPL widget
      }
    );

### Binding to everything

It is possible to bind to all events at either the global or channel level by using the method `bind_all`. This is used for debugging, but may have other utilities.

## Default events

There are a number of events which are used internally, but can also be of use elsewhere:

* connection_established
* subscribe

## Developing

In order to build a combined `pusher.js` and `pusher.min.js` just install the gem dependencies and run rake:

    gem install closure-compiler sprockets

    rake

For development purposes you can start a Sinatra application which will serve up the combined Javascript on <http://localhost:4567/pusher.js>. It allows you to link against this url in your app and freely modify files in `src`.

    ruby dev_server.rb
