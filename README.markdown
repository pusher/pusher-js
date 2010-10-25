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

Run a development server which serves bundled javascript from <http://localhost:4500/dev/pusher.js> so that you can edit files in /src freely

    ruby devserver.rb

In order to build the minified versions:

    gem install closure-compiler sprockets
    mv config/config.yml.example config/config.yml # and edit
    ENVIRONMENT=development rake

If you wish to host the javascript on your own server you need to change [:js][:host] in `config.yml`.

## Building

Define the version number in config/version.rb (should be in the format 1.2.3).

    rake build

## Uploading

Define S3 bucket config in config/config.yml

Set version in config/version.rb, build and upload

    ENVIRONMENT=production rake upload
    
For "pre-release" versions append "-pre" to version number, as in 1.2.3-pre

This will upload that specific "pre" version without overwriting the point release (1.2)

## Invalidating files from Amazon Cloud Front

Add [:s3][:cf_distribution_id] to config/config.yml (in the right environment)

    ENVIRONMENT=production rake acf:invalidate path=/1.6/pusher.js,/1.6/pusher.min.js
    
To invalidate all files in a version:

    ENVIRONMENT=production rake acf:invalidate_version version=1.6.0

This puts files in a queue for invalidation. To check status:

    ENVIRONMENT=production rake acf:invalidation_list
    
Use with caution. There's a limit on how many FREE invalidation requests you can issue as well as how many 'in-progress' ones you can have. Try grouping files together (comma-separated list in the 'path' parameter) instead of issuing separate requests.

Note: requires httparty

More: http://docs.amazonwebservices.com/AmazonCloudFront/latest/DeveloperGuide/index.html?Invalidation.html

## Testing

To run the tests first start the testing server by running `rake test` then visit <http://localhost:4567/>. The server posts to the production Pusher API using the environment variable `PUSHER_URL` in the form of:

    http://<PUSHER_KEY>:<PUSHER_SECRET>@api.pusherapp.com/apps/<PUSHER_APP_ID>

The tests link to a development version of the combined Pusher Javascript file <http://localhost:4567/pusher.js> allowing you to modify files in `src`.
