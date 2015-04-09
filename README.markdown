# Pusher Javascript Client

This library is an open source client that allows Javascript clients to connect to the [Pusher webservice](http://pusherapp.com/). It is highly recommended that you use the hosted version of this file to stay up to date with the latest updates.

We have included the source code for following libraries:

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

There are a number of configuration parameters which can be set for the Pusher client, which can be passed as an object to the Pusher constructor, i.e.:

    var pusher = new Pusher(API_KEY, {
        authEndpoint: "http://example.com/pusher/auth"
    });

For most users, there is little need to change these. See [client API guide](http://pusher.com/docs/client_api_guide/client_connect) for more details.

#### `encrypted` (Boolean)

Forces the connection to use encrypted transports.

#### `authEndpoint` (String)

Endpoint on your server that will return the authentication signature needed for private channels.

#### `authTransport` (String)

Defines how the authentication endpoint, defined using authEndpoint, will be called. There are two options available: `ajax` and `jsonp`.

#### `auth` (Hash)

Allows passing additional data to authorizers. Supports query string params and headers (AJAX only). For example, following will pass `foo=bar` via the query string and `baz: boo` via headers:

    var pusher = new Pusher(API_KEY, {
      auth: {
        params: { foo: "bar" },
        headers: { baz: "boo" }
      }
    });

#### `cluster` (String)

Allows connecting to a different datacenter by setting up correct hostnames and ports for the connection.

    // will connect to the 'eu' cluster
    var pusher = new Pusher(API_KEY, { cluster: "eu" });

#### `disableStats` (Boolean)

Disables stats collection, so that connection metrics are not submitted to Pusher’s servers.

#### `enabledTransports` (Array)

Specifies which transports should be used by Pusher to establish a connection. Useful for applications running in controlled, well-behaving environments. Available transports: `ws`, `wss`, `xhr_streaming`, `xhr_polling`, `sockjs`. Additional transports may be added in the future and without adding them to this list, they will be disabled.

    // will only use WebSockets
    var pusher = new Pusher(API_KEY, { enabledTransports: ["ws"] });

#### `disabledTransports` (Array)

Specified which transports must not be used by Pusher to establish a connection. This settings overwrites transports whitelisted via the `enabledTransports` options. Available transports: `ws`, `wss`, `xhr_streaming`, `xhr_polling`, `sockjs`. Additional transports may be added in the future and without adding them to this list, they will be enabled.

    // will use all transports except for sockjs
    var pusher = new Pusher(API_KEY, { disabledTransports: ["sockjs"] });

    // will only use WebSockets
    var pusher = new Pusher(API_KEY, {
      enabledTransports: ["ws", "xhr_streaming"],
      disabledTransports: ["xhr_streaming"]
    });

#### `wsHost`, `wsPort`, `wssPort`, `httpHost`, `httpPort`, `httpsPort`

These can be changed to point to alternative Pusher URLs (used internally for our staging server).

#### `ignoreNullOrigin` (Boolean)

Ignores null origin checks for HTTP fallbacks. Use with care, it should be disabled only if necessary (i.e. PhoneGap).

#### `activityTimeout` (Integer)

After this time (in miliseconds) without any messages received from the server, a ping message will be sent to check if the connection is still working. Default value is is supplied by the server, low values will result in unnecessary traffic.

#### `pongTimeout` (Integer)

Time before the connection is terminated after sending a ping message. Default is 30000 (30s). Low values will cause false disconnections, if latency is high.

## Connection

A connection to Pusher is established by providing your API key to the constructor function:

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

It is possible to access all subscribed channels through the `allChannels` function:

    var channels = socket.allChannels();
    console.group('Pusher - subscribed to:');
    for (var i = 0; i < channels.length; i++) {
        var channel = channels[i];
        console.log(channel.name);
    }
    console.groupEnd();

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

These are bound to a specific channel, and mean that you can reuse event names in different parts of your client application. The following might be an example of a stock tracking app where several channels are opened for different companies:

    var socket = new Pusher('MY_API_KEY');
    var channel = socket.subscribe('APPL');
    channel.bind('new-price',
      function(data) {
        // add new price into the APPL widget
      }
    );

### Bind event handler with optional context

It is possible to provide a third, optional parameter that is used as the `this` value when calling a handler:

    var context = { title: 'Pusher' };
    var handler = function(){
      console.log('My name is ' + this.title);
    };
    channel.bind('new-comment', handler, context);

### Unbind event handlers

Remove previously-bound handlers from an object. Only handlers that match all of the provided arguments (`eventName`, `handler` or `context`) are removed:

    channel.unbind('new-comment', handler); // removes just `handler` for the `new-comment` event
    channel.unbind('new-comment'); // removes all handlers for the `new-comment` event
    channel.unbind(null, handler); // removes `handler` for all events
    channel.unbind(null, null, context); // removes all handlers for `context`
    channel.unbind(); // removes all handlers on `channel`


### Binding to everything

It is possible to bind to all events at either the global or channel level by using the method `bind_all`. This is used for debugging, but may have other utilities.

## Batching auth requests (aka multi-auth)

Currently, pusher-js itself does not support authenticating multiple channels in one HTTP request. However, thanks to @dirkbonhomme you can use the [pusher-js-auth](https://github.com/dirkbonhomme/pusher-js-auth) plugin that buffers subscription requests and sends auth requests to your endpoint in batches.

## Default events

There are a number of events which are used internally, but can also be of use elsewhere:

* connection_established
* subscribe

## Self-serving JS files

You can host JavaScript files yourself, but it's a bit more complicated than putting them somewhere and just linking `pusher.js` in the source of your website. Because pusher-js loads fallback files dynamically, the dependency loader must be configured correctly or it will be using `js.pusher.com`.

First, make sure you expose all files from the `dist` directory. They need to be in a directory with named after the version number. For example, if you're hosting version 2.1.3 under `http://example.com/pusher-js` (and https for SSL), files should be accessible under following URL's:

    http://example.com/pusher-js/2.1.3/pusher.js
    http://example.com/pusher-js/2.1.3/json2.js
    http://example.com/pusher-js/2.1.3/sockjs.js

Minified files should have `.min` in names, as in the `dist` directory:

    http://example.com/pusher-js/2.1.3/pusher.min.js
    http://example.com/pusher-js/2.1.3/json2.min.js
    http://example.com/pusher-js/2.1.3/sockjs.min.js

Then after loading `pusher.js`, but before connecting, you need to overwrite the dependency loader by executing following piece of code:

    Pusher.Dependencies = new Pusher.DependencyLoader({
      cdn_http: "http://example.com/pusher-js/",
      cdn_https: "https://example.com/pusher-js/",
      version: Pusher.VERSION,
      suffix: Pusher.dependency_suffix
    });

## SockJS compatibility

Most browsers have a limit of 6 simultaneous connections to a single domain, but Internet Explorer 6 and 7 have a limit of just 2. This means that you can only use a single Pusher connection in these browsers, because SockJS requires an HTTP connection for incoming data and another one for sending. Opening the second connection will break the first one as the client won't be able to respond to ping messages and get disconnected eventually.

All other browsers work fine with two or three connections.

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

This will clean sockjs-client submodule, check out last committed revision, rebuild SockJS fallback files and then run JBundle. Don't run this command if you have uncommitted changes in any of submodules, since it might overwrite them.

## Testing

### Jasmine

Jasmine test suite contains two types of tests:

1. unit tests,
2. integration tests.

Unit tests are simple, fast and don't need any external dependencies. Integration tests usually connect to production and js-integration-api servers and can use a local server for loading JS files, so they need an Internet connection to work.

There are several ways to run jasmine tests. All commands mentioned below also start a JBundle server, which is required for integration tests.

Please make sure you run bundler before running any of following commands.

    bundle install

#### Run tests manually in a browser

First, start the jasmine and JSONP integration servers:

    bin/jasmine

Then open any browser and navigate to <http://localhost:8888/> - it will run both unit and integration tests.

#### Run headless tests

Running headless tests is very convenient for development, especially when using guard. Make sure you have PhantomJS installed - you can use `brew install phantomjs` on OS X. Start jasmine and guard:

    bin/guard

Tests will be run automatically in the terminal. Guard watches JS files and specs and re-runs aproppriate tests whenever you save any changes. Press enter to re-run all tests.

Guard runs only unit tests - partially because PhantomJS does not support WebSockets, partially for convenience.

There's also a JSHint watch, which will validate JS files on save.

#### Run karma

Testacular also runs tests automatically, but it uses actual browsers to execute them. First, install karma npm modules

    npm install

Then start the server, run one of following commands:

    bin/karma-unit           # runs only unit tests
    bin/karma-integration    # runs only integration tests
    bin/karma                # runs both unit and integration tests

All configured browsers will be automatically opened and will run all tests. Testacular also re-executes all specs on file changes. After you close the server, browsers will get shut down too.
