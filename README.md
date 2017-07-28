# Pusher Javascript Client

This Pusher client library supports web browsers, web workers, Node.js and
React Native.

If you're looking for the Pusher server library for Node.js, use
[pusher-http-node](https://github.com/pusher/pusher-http-node) instead.

For tutorials and more in-depth information about the Pusher platform, visit
our [official docs](https://pusher.com/docs/javascript_quick_start).

## Usage Overview

The following topics are covered:

* [Installation](https://github.com/pusher/pusher-js#installation)
  * [Web](https://github.com/pusher/pusher-js#web)
  * [React Native](https://github.com/pusher/pusher-js#react-native)
  * [Web Workers](https://github.com/pusher/pusher-js#web-workers)
  * [Node.js](https://github.com/pusher/pusher-js#nodejs)
* [Initialization](https://github.com/pusher/pusher-js#initialization)
* [Configuration](https://github.com/pusher/pusher-js#configuration)
* [Global Configuration](https://github.com/pusher/pusher-js#global-configuration)
* [Connection](https://github.com/pusher/pusher-js#connection)
  * [Socket IDs](https://github.com/pusher/pusher-js#socket-ids)
* [Subscribing to Channels (Public and Private)](https://github.com/pusher/pusher-js#subscribing-to-channels)
* [Binding to Events](https://github.com/pusher/pusher-js#binding-to-events)
* [Default events](https://github.com/pusher/pusher-js#default-events)
* [Developing](https://github.com/pusher/pusher-js#developing)
  * [Core vs. Platform-specific Code](https://github.com/pusher/pusher-js#core-vs-platform-specific-code)
  * [Building](https://github.com/pusher/pusher-js#building)
  * [Testing](https://github.com/pusher/pusher-js#testing)

## Installation

### Web

If you're using Pusher on a web page, you can install the library via:

#### Yarn (or NPM)

You can use any NPM-compatible package manager, including NPM itself and Yarn.

```bash
yarn add pusher-js
```

Then:

```javascript
import Pusher from 'pusher-js';
```

Or, if you're not using ES6 modules:

```javascript
const Pusher = require('pusher-js');
```

#### CDN

```html
<script src="https://js.pusher.com/4.1/pusher.min.js"></script>
```

You can also use [cdnjs.com](https://cdnjs.com/libraries/pusher) if you prefer
or as a fallback.

#### Bower (discouraged)

Or via [Bower](http://bower.io/):

```bash
bower install pusher
```

and then:

```html
<script src="bower_components/pusher/dist/web/pusher.min.js"></script>
```

### React Native

Use a package manager like Yarn or NPM to install `pusher-js` and then import
it as follows:

```javascript
import Pusher from 'pusher-js/react-native';
```

Notes:

* The fallbacks available for this runtime are HTTP streaming and polling.
* This build uses React Native's NetInfo API to detect changes on connectivity state. It will use this to automatically reconnect.

### Web Workers

You can import the worker script (`pusher.worker.js`, not `pusher.js`) from the CDN:

```javascript
importScripts('https://js.pusher.com/4.1/pusher.worker.min.js');
```

### Node.js

Having installed `pusher-js` via an NPM-compatible package manager, simply:

```javascript
import Pusher from 'pusher-js';
```

Notes:

* For standard `WebWorkers`, this build will use HTTP as a fallback.
* For `ServiceWorkers`, as the `XMLHttpRequest` API is unavailable, there is currently no support for HTTP fallbacks. However, we are open to requests for fallbacks using `fetch` if there is demand.

## Initialization

```js
const socket = new Pusher(APP_KEY, {
  cluster: APP_CLUSTER,
});
```

You can get your `APP_KEY` and `APP_CLUSTER` from the [Pusher dashboard](https://dashboard.pusher.com/).

## Configuration

There are a number of configuration parameters which can be set for the Pusher client, which can be passed as an object to the Pusher constructor, i.e.:

```js
const socket = new Pusher(APP_KEY, {
  cluster: APP_CLUSTER,
  authEndpoint: 'http://example.com/pusher/auth',
  encrypted: true
});
```

For most users, there is little need to change these. See [client API guide](http://pusher.com/docs/client_api_guide/client_connect) for more details.

#### `encrypted` (Boolean)

Forces the connection to use encrypted transports.

#### `authEndpoint` (String)

Endpoint on your server that will return the authentication signature needed for private channels.

#### `authTransport` (String)

Defines how the authentication endpoint, defined using authEndpoint, will be called. There are two options available: `ajax` and `jsonp`.

#### `auth` (Hash)

Allows passing additional data to authorizers. Supports query string params and headers (AJAX only). For example, following will pass `foo=bar` via the query string and `baz: boo` via headers:

```js
const socket = new Pusher(APP_KEY, {
  cluster: APP_CLUSTER,
  auth: {
    params: { foo: 'bar' },
    headers: { baz: 'boo' }
  }
});
```

##### CSRF

If you require a CSRF header for incoming requests to the private channel authentication endpoint on your server, you should add a CSRF token to the `auth` hash under `headers`. This is applicable to frameworks which apply CSRF protection by default.

```js
const socket = new Pusher(APP_KEY, {
  cluster: APP_CLUSTER,
  auth: {
    params: { foo: 'bar' },
    headers: { 'X-CSRF-Token': 'SOME_CSRF_TOKEN' }
  }
});
```

#### `authorizer` (Function)

If you need custom authorization behavior you can provide your own `authorizer` function as follows:

```js
const pusher = new Pusher(APP_KEY, {
  cluster: APP_CLUSTER,
  authorizer: function (channel, options) {
    return {
      authorize: function (socketId, callback) {
        // Do some ajax to get the auth information
        callback(false, authInformation);
      }
    };
  }
})
```

#### `cluster` (String)

Allows connecting to a different datacenter by setting up correct hostnames and ports for the connection.

```js
const socket = new Pusher(APP_KEY, {
  cluster: APP_CLUSTER,
});
```

#### `disableStats` (Boolean)

Disables stats collection, so that connection metrics are not submitted to Pusher’s servers. These stats are used for internal monitoring only and they do not affect the account stats.

#### `enabledTransports` (Array)

Specifies which transports should be used by Pusher to establish a connection. Useful for applications running in controlled, well-behaving environments. Available transports for web: `ws`, `wss`, `xhr_streaming`, `xhr_polling`, `sockjs`. Additional transports may be added in the future and without adding them to this list, they will be disabled.

```js
// Only use WebSockets
const socket = new Pusher(APP_KEY, {
  cluster: APP_CLUSTER,
  enabledTransports: ['ws']
});
```

#### `disabledTransports` (Array)

Specified which transports must not be used by Pusher to establish a connection. This settings overwrites transports whitelisted via the `enabledTransports` options. Available transports for web: `ws`, `wss`, `xhr_streaming`, `xhr_polling`, `sockjs`. Additional transports may be added in the future and without adding them to this list, they will be enabled.

```js
// Use all transports except for sockjs
const socket = new Pusher(APP_KEY, {
  cluster: APP_CLUSTER,
  disabledTransports: ['sockjs']
});

// Only use WebSockets
const socket = new Pusher(APP_KEY, {
  cluster: APP_CLUSTER,
  enabledTransports: ['ws', 'xhr_streaming'],
  disabledTransports: ['xhr_streaming']
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

### `Pusher.logToConsole` (Boolean)

Enables logging to the browser console via calls to `console.log`.

### `Pusher.log` (Function)

Assign a custom log handler for the Pusher library logging. For example:

```js
Pusher.log = (msg) => {
  console.log(msg);
};
```

By setting the `log` property you also override the use of `Pusher.enableLogging`.

## Connection

A connection to Pusher is established by providing your `APP_KEY` and `APP_CLUSTER` to the constructor function:

```js
const socket = new Pusher(APP_KEY, {
  cluster: APP_CLUSTER,
});
```

This returns a socket object which can then be used to subscribe to channels.

You may disconnect again by invoking the `disconnect` method:

```js
socket.disconnect();
```

### Socket IDs

Making a connection provides the client with a new `socket_id` that is assigned by the server. This can be used to distinguish the client's own events. A change of state might otherwise be duplicated in the client. More information on this pattern is available [here](http://pusherapp.com/docs/duplicates).

It is also stored within the socket, and used as a token for generating signatures for private channels.

## Subscribing to channels

### Public channels

The default method for subscribing to a channel involves invoking the `subscribe` method of your socket object:

```js
const channel = socket.subscribe('my-channel');
```

This returns a Channel object which events can be bound to.

### Private channels

Private channels are created in exactly the same way as normal channels, except that they reside in the 'private-' namespace. This means prefixing the channel name:

```js
const channel = socket.subscribe('private-my-channel');
```

It is possible to access channels by name, through the `channel` function:

```js
const channel = socket.channel('private-my-channel');
```

It is possible to access all subscribed channels through the `allChannels` function:

```js
socket.allChannels().forEach(channel => console.log(channel.name));
```

Private and presence channels will make a request to your `authEndpoint` (`/pusher/auth`) by default, where you will have to [authenticate the subscription](https://pusher.com/docs/authenticating_users). You will have to send back the correct auth response and a 200 status code.

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

Event binding takes a very similar form to the way events are handled in jQuery. You can use the following methods either on a channel object, to bind to events on a particular channel; or on the pusher object, to bind to events on all subscribed channels simultaneously.

### `bind` and `unbind`
Binding to "new-message" on channel: The following logs message data to the console when "new-message" is received
```js
channel.bind('new-message', function (data) {
  console.log(data.message);
});
```

We can also provide the `this` value when calling a handler as a third optional parameter. The following logs "hi Pusher" when "my-event" is fired.

```js
channel.bind('my-event', function () {
  console.log(`hi ${this.name}`);
}, { name: 'Pusher' });
```

Unsubscribe behaviour varies depending on which parameters you provide it with. For example:

```js
// Remove just `handler` for the `new-comment` event
channel.unbind('new-comment', handler);

// Remove all handlers for the `new-comment` event
channel.unbind('new-comment');

// Remove `handler` for all events
channel.unbind(null, handler);

// Remove all handlers for `context`
channel.unbind(null, null, context);

// Remove all handlers on `channel`
channel.unbind();
```

### `bind_global` and `unbind_global`

`bind_global` and `unbind_global` work much like `bind` and `unbind`, but instead of only firing callbacks on a specific event, they fire callbacks on any event, and provide that event along to the handler along with the event data. For example:

```js
channel.bind_global(function (event, data) {
  console.log(`The event ${event} was triggered with data ${data}`);
})
```

`unbind_global` works similarly to `unbind`.

```js
// remove just `handler` from global bindings
channel.unbind_global(handler);

// remove all global bindings
channel.unbind_global();
```

### `unbind_all`

The `unbind_all` method is equivalent to calling `unbind()` and `unbind_global()` together; it removes all bindings, global and event specific.

## Batching auth requests (aka multi-auth)

Currently, pusher-js itself does not support authenticating multiple channels in one HTTP request. However, thanks to @dirkbonhomme you can use the [pusher-js-auth](https://github.com/dirkbonhomme/pusher-js-auth) plugin that buffers subscription requests and sends auth requests to your endpoint in batches.

## Default events

There are a number of events which are used internally, but can also be of use elsewhere:

* subscribe

## Connection Events

To listen for when you connect to Pusher:

```js
socket.connection.bind('connected', callback);
```

And to bind to disconnections:

```js
socket.connection.bind('disconnected', callback);
```

## Self-serving JS files

You can host JavaScript files yourself, but it's a bit more complicated than putting them somewhere and just linking `pusher.js` in the source of your website. Because pusher-js loads fallback files dynamically, the dependency loader must be configured correctly or it will be using `js.pusher.com`.

First, clone this repository and run `npm install && git submodule init && git submodule update`. Then run:

    $ CDN_HTTP='http://your.http.url' CDN_HTTPS='https://your.https.url' make web

In the `dist/web` folder, you should see the files you need: `pusher.js`, `pusher.min.js`, `json2.js`, `json.min.js`, `sockjs.js` and `sockjs.min.js`. `pusher.js` should be built referencing your URLs as the dependency hosts.

First, make sure you expose all files from the `dist` directory. They need to be in a directory with named after the version number. For example, if you're hosting version 4.1.1 under `http://example.com/pusher-js` (and https for SSL), files should be accessible under following URL's:

    http://example.com/pusher-js/4.1.1/pusher.js
    http://example.com/pusher-js/4.1.1/json2.js
    http://example.com/pusher-js/4.1.1/sockjs.js

Minified files should have `.min` in their names, as in the `dist/web` directory:

    http://example.com/pusher-js/4.1.1/pusher.min.js
    http://example.com/pusher-js/4.1.1/json2.min.js
    http://example.com/pusher-js/4.1.1/sockjs.min.js

## SockJS compatibility

Most browsers have a limit of 6 simultaneous connections to a single domain, but Internet Explorer 6 and 7 have a limit of just 2. This means that you can only use a single Pusher connection in these browsers, because SockJS requires an HTTP connection for incoming data and another one for sending. Opening the second connection will break the first one as the client won't be able to respond to ping messages and get disconnected eventually.

All other browsers work fine with two or three connections.

## Developing

Install all dependencies via Yarn:

```bash
yarn install
```

Run a development server which serves bundled javascript from <http://localhost:5555/pusher.js> so that you can edit files in /src freely.

```bash
make serve
```

You can optionally pass a `PORT` environment variable to run the server on a different port. You can also pass `CDN_HTTP` and `CDN_HTTPS` variables if you wish the library to load dependencies from a new host.

This command will serve `pusher.js`, `sockjs.js`, `json2.js`, and their respective minified versions.

### Core Vs. Platform-Specific Code

New to PusherJS 3.1 is the ability for the library to produce builds for different runtimes: classic web, React Native, NodeJS and
Web Workers.

In order for this to happen, we have split the library into two directories: `core/` and `runtimes/`. In `core` we keep anything that is platform-independent. In `runtimes` we keep code that depends on certain runtimes.

Throughout the `core/` directory you'll find this line:

```javascript
import Runtime from "runtime";
```

We use webpack module resolution to make the library look for different versions of this module depending on the build.

For web it will look for `src/runtimes/web/runtime.ts`. For ReactNative, `src/runtimes/react-native/runtime.ts`. For Node:  `src/runtimes/node/runtime.ts`. For worker: `src/runtimes/worker/runtime.ts`.

Each of these runtime files exports an object (conforming to the interface you can see in `src/runtimes/interface.ts`) that abstracts away everything platform-specific. The core library pulls this object in without any knowledge of how it implements it. This means web build can use the DOM underneath, the ReactNative build can use its native NetInfo API, Workers can use `fetch` and so on.

### Building

In order to build SockJS, you must first initialize and update the Git submodule:

```bash
git submodule init
git submodule update
```

Then simply run:

```bash
make web
```

This will build the source files relevant for the web build into `dist/web`.

In order to specify the library version, you can either update `package.json` or pass a `VERSION` environment variable upon building.

Other build commands include:

```bash
make react-native # for the React Native build
make node         # for the NodeJS build
make worker       # for the worker build
```

### Testing

Each test environment contains two types of tests:

1. unit tests,
2. integration tests.

Unit tests are simple, fast and don't need any external dependencies. Integration tests usually connect to production and js-integration-api servers and can use a local server for loading JS files, so they need an Internet connection to work.

There are 3 different testing environments: one for web, one for NodeJS and one for workers. We may consider adding another one for React Native in the future.

The web and worker tests use [Karma](https://github.com/karma-runner/karma) to execute specs in real browsers. The NodeJS tests use [jasmine-node](https://github.com/mhevery/jasmine-node).

To run the tests:

```bash
# For web
make web_unit
make web_integration

# For NodeJS
make node_unit
make node_integration

# For workers
make worker_unit
make worker_integration
```

If you want your Karma tests to automatically reload, then in `spec/karma/config.common.js` set `singleRun` to `false`.
