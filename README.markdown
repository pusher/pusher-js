# Pusher Javascript Client

This library is an open source client that allows Javascript clients to connect to the [Pusher webservice](http://pusherapp.com/). It is highly recommended that you use the hosted version of this file to stay up to date with the latest updates.

We have included the source code for following libraries:

* websocket-js
* sockjs-client 

They both include their own licences.

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

    var socket = new Pusher('MY_API_KEY');
    var my_channel = socket.subscribe('my-channel');
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

Use Bundler to install all development dependencies

    bundle install

and create a local config file

    mv config/config.yml.example config/config.yml # and edit

Run a development server which serves bundled javascript from <http://localhost:5555/pusher.js> so that you can edit files in /src freely.

    bundle exec jbundle server

In order to build the minified versions:

    ENVIRONMENT=development rake build

If you wish to host the javascript on your own server you need to change [:js][:host] in `config.yml` and then rebuild.

## Building

`./JFile` declares all bundles, src dir and target dir. See [https://github.com/ismasan/jbundle](https://github.com/ismasan/jbundle)
Define the version number in JFile (should be in the format 1.2.3).

    rake build

That writes source and minified versions of each bundle declared in the JFile into versioned directories. For example if the JFile says

    version '1.7.1'

Then rake build will put copies of the files in ./dist/1.7.1/ and ./dist/1.7/

However for a prerelease

    version '1.7.2-pre'

It will only write to the full, suffixed directory ./dist/1.7.2-pre

This is so prereleases don't overwrite the previous stable release.

### Clean builds

Building everything from scratch is useful when you update submodules, which need compiling. If you want to perform a clean build, run:

    bin/build

This will clean web-socket-js and sockjs-client submodules, check out last committed revisions, rebuild Flash fallback files and then run JBundle. Don't run this command if you have uncommitted changes in any of submodules, since it might overwrite them.

## Testing

### Jasmine

There are several ways to run jasmine tests. Please make sure you run bundler before running any of following commands.

    bundle install

#### Run tests manually in a browser

First, start the jasmine and JSONP integration servers:

    bin/jasmine

Then open any browser and navigate to <http://localhost:8888/>.

#### Run headless tests

Running headless tests is very convenient for development, especially when using guard. Make sure you have PhantomJS installed - you can use `brew install phantomjs` on OS X. Start jasmine and guard:

    bin/guard

Tests will be run automatically in the terminal. Guard watches JS files and specs and re-runs aproppriate tests whenever you save any changes. Press enter to re-run all tests.

There's also a JSHint watch, which will validate JS files on save.

#### Run testacular

Testacular also runs tests automatically, but it uses actual browsers to execute them. First, install testacular npm module

    npm install -g testacular

Then start the server:

    bin/testacular

All configured browsers will be automatically opened and will run all tests. Testacular also re-executes specs on file changes. After you close the server, browsers will get shut down too.

### Old framework

There are still some tests in the old framework, though they will be removed in the future. Open `test/sane/index.html` and click run to execute the suite.
