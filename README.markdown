# pusher-websocket-js-iso

EXPERIMENTAL Isomorphic WebSocket client for [Pusher](http://pusher.com/).

Supports several JavaScript runtimes, including web browsers, React Native and Node.js.

For our official JS library, [follow this link](https://github.com/pusher/pusher-js).

## Usage overview

The following topics are covered:

* Difference to PusherJS
* Installation
* Supported Platforms
* Configuration
* Global configuration
* Connection
* Socket ids
* Subscribing to channels (public and private)
* Binding to events
  * Globally
  * Per-channel
* Default events

## Difference to [PusherJS](http://github.com/pusher/pusher-js)

In order for the library to work in non-browser environments, we have had to 
remove the library's dependency on the DOM. In PusherJS, the DOM is used for JSONp and to dynamically load
dependencies, such as XHR and SockJS fallbacks.

As a result:

* JSONp channel authorization is no longer supported.
* SockJS is removed as a fallback. Therefore the library drops compatibility for older browsers
that do not support XHR.
* XHR fallbacks are built into the same file and are not dynamically loaded.

## Installation

### Bower

```
bower install pusher-websocket-iso
```

and then

```html
<script src="bower_components/dist/web/pusher.js"></script>
```

### NPM

```
npm install pusher-websocket-iso
```

## Supported Platforms

### Browser

Install through Bower, or download `dist/web/pusher.js`. For use with UMD, use `dist/web-umd/pusher.js`.

### Web Worker

Download and import `dist/worker/pusher.js`.

### NodeJS

Install the library through NPM and import the module:

```js
var Pusher = require('pusher-websocket-iso');
```

### React Native

Install the library through NPM, and add import the build specific to React Native:

```js
var Pusher = require('pusher-websocket-iso/react-native');
```

## Initialization

```js
var pusher = new Pusher(APP_KEY);
```

## Configuration

There are a number of configuration parameters which can be set for the Pusher client, which can be passed as an object to the Pusher constructor, i.e.:

```js
var pusher = new Pusher(APP_KEY, {
    authEndpoint: "http://example.com/pusher/auth",
    encrypted: true
});
```

For most users, there is little need to change these. See [client API guide](http://pusher.com/docs/client_api_guide/client_connect) for more details.

#### `encrypted` (Boolean)

Forces the connection to use encrypted transports.

#### `authEndpoint` (String)

Endpoint on your server that will return the authentication signature needed for private channels.

#### `auth` (Hash)

Allows passing additional data to authorizers. Supports query string params and headers (AJAX only). For example, following will pass `foo=bar` via the query string and `baz: boo` via headers:

```js
var pusher = new Pusher(API_KEY, {
  auth: {
    params: { foo: "bar" },
    headers: { baz: "boo" }
  }
});
```

##### CSRF

If you require a CSRF header for incoming requests to the private channel authentication endpoint on your server, you should add a CSRF token to the `auth` hash under `headers`. This is applicable to frameworks which apply CSRF protection by default.

```js
var pusher = new Pusher(API_KEY, {
  auth: {
    params: { foo: "bar" },
    headers: { "X-CSRF-Token": "SOME_CSRF_TOKEN" }
  }
});
```

#### `cluster` (String)

Allows connecting to a different datacenter by setting up correct hostnames and ports for the connection.

```js
// will connect to the 'eu' cluster
var pusher = new Pusher(API_KEY, { cluster: "eu" });
```

#### `disableStats` (Boolean)

Disables stats collection, so that connection metrics are not submitted to Pusher’s servers.

#### `enabledTransports` (Array)

Specifies which transports should be used by Pusher to establish a connection. Useful for applications running in controlled, well-behaving environments. Available transports: `ws`, `wss`, `xhr_streaming`, `xhr_polling`. Additional transports may be added in the future and without adding them to this list, they will be disabled.

```js
// will only use WebSockets
var pusher = new Pusher(API_KEY, { enabledTransports: ["ws"] });
```

#### `disabledTransports` (Array)

Specified which transports must not be used by Pusher to establish a connection. This settings overwrites transports whitelisted via the `enabledTransports` options. Available transports: `ws`, `wss`, `xhr_streaming`, `xhr_polling`. Additional transports may be added in the future and without adding them to this list, they will be enabled.

```js
// will use all transports except for ws
var pusher = new Pusher(API_KEY, { disabledTransports: ["ws"] });

// will only use WebSockets
var pusher = new Pusher(API_KEY, {
  enabledTransports: ["ws", "xhr_streaming"],
  disabledTransports: ["xhr_streaming"]
});
```

#### `wsHost`, `wsPort`, `wssPort`, `httpHost`, `httpPort`, `httpsPort`

These can be changed to point to alternative Pusher URLs (used internally for our staging server).

#### `ignoreNullOrigin` (Boolean)

Ignores null origin checks for HTTP fallbacks. Use with care, it should be disabled only if necessary (i.e. PhoneGap).

#### `activityTimeout` (Integer)

After this time (in miliseconds) without any messages received from the server, a ping message will be sent to check if the connection is still working. Default value is is supplied by the server, low values will result in unnecessary traffic.

#### `pongTimeout` (Integer)

Time before the connection is terminated after sending a ping message. Default is 30000 (30s). Low values will cause false disconnections, if latency is high.

## Global configuration

### `Pusher.setLogger` (Function)

Assign a custom log handler for the Pusher library logging. For example:

```js
Pusher.setLogger(function(msg) {
  console.log(msg);
});
```

By setting the `log` property you also override the use of `Pusher.enableLogging`.

## Connection

A connection to Pusher is established by providing your API key to the constructor function:

```js
var socket = new Pusher(API_KEY);
```

This returns a socket object which can then be used to subscribe to channels.

### Socket IDs

Making a connection provides the client with a new `socket_id` that is assigned by the server. This can be used to distinguish the client's own events. A change of state might otherwise be duplicated in the client. More information on this pattern is available [here](http://pusherapp.com/docs/duplicates).

It is also stored within the socket, and used as a token for generating signatures for private channels.

## Subscribing to channels

### Public channels

The default method for subscribing to a channel involves invoking the `subscribe` method of your socket object:

```js
var my_channel = socket.subscribe('my-channel');
```

This returns a Channel object which events can be bound to.

### Private channels

Private channels are created in exactly the same way as normal channels, except that they reside in the 'private-' namespace. This means prefixing the channel name:

```js
var my_channel = socket.subscribe('private-my-channel');
```

It is possible to access channels by name, through the `channel` function:

```js
channel = socket.channel('private-my-channel');
```

It is possible to access all subscribed channels through the `allChannels` function:

```js
var channels = socket.allChannels();
console.group('Pusher - subscribed to:');
for (var i = 0; i < channels.length; i++) {
    var channel = channels[i];
    console.log(channel.name);
}
console.groupEnd();
```

## Unsubscribing from channels

To unsubscribe from a channel, invoke the `unsubscribe` method of your socket object:

```js
socket.unsubscribe('my-channel');
```

Unsubscribing from private channels is done in exactly the same way, just with the additional `private-` prefix:

```js
socket.unsubscribe('private-my-channel');
```

## Binding to events

Events can be bound to at 2 levels, the global, and per channel. They take a very similar form to the way events are handled in jQuery.

### Global events

You can attach behaviour to these events regardless of the channel the event is broadcast to. The following is an example of an app that binds to new comments from any channel:

```js
var socket = new Pusher('MY_API_KEY');
var my_channel = socket.subscribe('my-channel');
socket.bind('new-comment',
  function(data) {
    // add comment into page
  }
);
```

### Per-channel events

These are bound to a specific channel, and mean that you can reuse event names in different parts of your client application. The following might be an example of a stock tracking app where several channels are opened for different companies:

```js
var socket = new Pusher('MY_API_KEY');
var channel = socket.subscribe('APPL');
channel.bind('new-price',
  function(data) {
    // add new price into the APPL widget
  }
);
```

### Bind event handler with optional context

It is possible to provide a third, optional parameter that is used as the `this` value when calling a handler:

```js
var context = { title: 'Pusher' };
var handler = function(){
  console.log('My name is ' + this.title);
};
channel.bind('new-comment', handler, context);
```

### Unbind event handlers

Remove previously-bound handlers from an object. Only handlers that match all of the provided arguments (`eventName`, `handler` or `context`) are removed:

```js
channel.unbind('new-comment', handler); // removes just `handler` for the `new-comment` event
channel.unbind('new-comment'); // removes all handlers for the `new-comment` event
channel.unbind(null, handler); // removes `handler` for all events
channel.unbind(null, null, context); // removes all handlers for `context`
channel.unbind(); // removes all handlers on `channel`
```


### Binding to everything

It is possible to bind to all events at either the global or channel level by using the method `bind_all`. This is used for debugging, but may have other utilities.

## Default events

There are a number of events which are used internally, but can also be of use elsewhere:

* connection_established
* subscribe

## HTTP fallback compatibility

Most browsers have a limit of 6 simultaneous connections to a single domain. This means that you can use at most 3 Pusher connections in these browsers, because HTTP fallbacks require an HTTP connection for incoming data and another one for sending. Opening more connections will break existing ones as some clients won't be able to communicate with Pusher and will get disconnected eventually.

## Developing

TODO

## Building

TODO

## Testing

TODO
