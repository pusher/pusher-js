# Pusher Channels Javascript Client

![test badge](https://github.com/pusher/pusher-js/workflows/test/badge.svg)

This Pusher Channels client library supports web browsers, web workers and Node.js

If you're looking for the Pusher Channels server library for Node.js, use
[pusher-http-node](https://github.com/pusher/pusher-http-node) instead.

For tutorials and more in-depth information about Pusher Channels, visit
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
* [Accessing Channels](https://github.com/pusher/pusher-js#accessing-channels)
* [Binding to Events](https://github.com/pusher/pusher-js#binding-to-events)
* [Default events](https://github.com/pusher/pusher-js#default-events)
* [Developing](https://github.com/pusher/pusher-js#developing)
  * [Core vs. Platform-specific Code](https://github.com/pusher/pusher-js#core-vs-platform-specific-code)
  * [Building](https://github.com/pusher/pusher-js#building)
  * [Testing](https://github.com/pusher/pusher-js#testing)

## Supported platforms

* Web

  * We test against Chrome, Firefox and Safari.
  * Works [in web pages](https://github.com/pusher/pusher-js#web), [web
    workers and service
    workers](https://github.com/pusher/pusher-js#web-workers)
  * Works with all major web frameworks, including

    * Angular ([See Angular tutorial](https://pusher.com/tutorials/angular-realtime))
    * React ([See React tutorial](https://pusher.com/tutorials/react-websockets))
    * Vue.js ([see Vue.js tutorial](https://pusher.com/tutorials/realtime-app-vuejs))

* [React Native](https://github.com/pusher/pusher-js#react-native)
* [Node.js](https://github.com/pusher/pusher-js#nodejs)

## Installation

### Web

If you're using Pusher Channels on a web page, you can install the library via:

#### Encrypted Channel Support

The encryption primitives required to power [encrypted
channels](https://github.com/pusher/pusher-js#encrypted-channels) increase the
bundle size quite significantly. In order to keep bundle sizes down, the
default web and worker builds of pusher-js no longer support [encrypted
channels](https://github.com/pusher/pusher-js#encrypted-channels).

If you'd like to make use of encrypted-channels, you need to import the
`with-encryption` builds as described below.

#### Yarn (or NPM)

You can use any NPM-compatible package manager, including NPM itself and Yarn.

```bash
yarn add pusher-js
```

Then:

```javascript
import Pusher from 'pusher-js';
```

If you'd like to use encrypted channels:

```javascript
import Pusher from 'pusher-js/with-encryption';
```

Or, if you're not using ES6 modules:

```javascript
const Pusher = require('pusher-js');
```

If you'd like to use encrypted channels:

```javascript
const Pusher = require('pusher-js/with-encryption');
```

#### CDN

```html
<script src="https://js.pusher.com/7.0/pusher.min.js"></script>
```

If you'd like to use encrypted channels:

```html
<script src="https://js.pusher.com/7.0/pusher-with-encryption.min.js"></script>
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

### Typescript

We've provided typescript declarations since v5.1.0. Most things should work
out of the box but if you need access to specific types you can import them
like so:

```
import Pusher from 'pusher-js';
import * as PusherTypes from 'pusher-js';

var presenceChannel: PusherTypes.PresenceChannel;
...
```

### React Native

> **⚠️ Important notice** 
>
> React Native support has been **deprecated** and soon will be removed from this repository. 
> 
> Please, use our official [React Native SDK](https://github.com/pusher/pusher-websocket-react-native) instead.

### Web Workers
(`pusher-js`'s Web Workers implementation is currently not compatible with Internet Explorer)
You can import the worker script (`pusher.worker.js`, not `pusher.js`) from the CDN:

```javascript
importScripts('https://js.pusher.com/7.0/pusher.worker.min.js');
```

If you'd like to use encrypted channels:

```javascript
importScripts('https://js.pusher.com/7.0/pusher-with-encryption.worker.min.js');
```

If you're building your worker with a bundler, you can import the worker entrypoint

```
import Pusher from 'pusher-js/worker'
```

If you'd like to use encrypted channels:

```
import Pusher from 'pusher-js/worker/with-encryption'
```

### Node.js

Having installed `pusher-js` via an NPM-compatible package manager, run:

```javascript
import Pusher from 'pusher-js';
```

Notes:

* For standard `WebWorkers`, this build will use HTTP as a fallback.
* For `ServiceWorkers`, as the `XMLHttpRequest` API is unavailable, there is currently no support for HTTP fallbacks. However, we are open to requests for fallbacks using `fetch` if there is demand.

## Initialization

```js
const pusher = new Pusher(APP_KEY, {
  cluster: APP_CLUSTER,
});
```

You can get your `APP_KEY` and `APP_CLUSTER` from the [Pusher Channels dashboard](https://dashboard.pusher.com/).

## Configuration

There are a number of configuration parameters which can be set for the client, which can be passed as an object to the Pusher constructor, i.e.:

```js
const pusher = new Pusher(APP_KEY, {
  cluster: APP_CLUSTER,
  channelAuthorization: {
    endpoint: 'http://example.com/pusher/auth'
  },
});
```

For most users, there is little need to change these. See [client API guide](http://pusher.com/docs/client_api_guide/client_connect) for more details.

#### `forceTLS` (Boolean)

Forces the connection to use TLS. When set to `false` the library will attempt non-TLS connections first. Defaults to `true`.

### `userAuthentication` (Object)

Object containing the configuration for user authentication. Valid keys are:

* `endpoint` (String) - Endpoint on your server that will return the authentication signature needed for signing the user in. Defaults to `/pusher/user-auth`.

* `transport` (String) - Defines how the authentication endpoint will be called. There are two options available:
  * `ajax` - the **default** option where an `XMLHttpRequest` object will be used to make a request. The parameters will be passed as `POST` parameters.
  * `jsonp` - The authentication endpoint will be called by a `<script>` tag being dynamically created pointing to the endpoint defined by `userAuthentication.endpoint`. This can be used when the authentication endpoint is on a different domain to the web application. The endpoint will therefore be requested as a `GET` and parameters passed in the query string.

* `params` (Object) - Additional parameters to be sent when the user authentication endpoint is called. When using ajax authentication the parameters are passed as additional POST parameters. When using jsonp authentication the parameters are passed as GET parameters. This can be useful with web application frameworks that guard against CSRF (Cross-site request forgery).

* `headers` (Object) - Only applied when using `ajax` as authentication transport. Provides the ability to pass additional HTTP Headers to the user authentication endpoint. This can be useful with some web application frameworks that guard against CSRF CSRF (Cross-site request forgery).

* `customHandler` (Function) - When present, this function is called instead of a request being made to the endpoint specified by `userAuthentication.endpoint`.


For more information see [authenticating users](https://pusher.com/docs/channels/server_api/authenticating-users/).


### `channelAuthorization` (Object)

Object containing the configuration for user authorization. Valid keys are:

* `endpoint` (String) - Endpoint on your server that will return the authorization signature needed for private and presence channels. Defaults to `/pusher/user-auth`.

* `transport` (String) - Defines how the authorization endpoint will be called. There are two options available:
  * `ajax` - the **default** option where an `XMLHttpRequest` object will be used to make a request. The parameters will be passed as `POST` parameters.
  * `jsonp` - The authorization endpoint will be called by a `<script>` tag being dynamically created pointing to the endpoint defined by `channelAuthorization.endpoint`. This can be used when the authorization endpoint is on a different domain to the web application. The endpoint will therefore be requested as a `GET` and parameters passed in the query string.

* `params` (Object) - Additional parameters to be sent when the channel authorization endpoint is called. When using ajax authorization the parameters are passed as additional POST parameters. When using jsonp authorization the parameters are passed as GET parameters. This can be useful with web application frameworks that guard against CSRF (Cross-site request forgery).

* `headers` (Object) - Only applied when using `ajax` as authorizing transport. Provides the ability to pass additional HTTP Headers to the user authorization endpoint. This can be useful with some web application frameworks that guard against CSRF CSRF (Cross-site request forgery).

* `customHandler` (Function) - When present, this function is called instead of a request being made to the endpoint specified by `channelAuthorization.endpoint`.


For more information see [authorizing users](https://pusher.com/docs/channels/server_api/authorizing-users).


#### `cluster` (String)

Specifies the cluster that pusher-js should connect to. [If you'd like to see a full list of our clusters, click here](https://pusher.com/docs/clusters). If you do not specify a cluster, `mt1` will be used by default.

```js
const pusher = new Pusher(APP_KEY, {
  cluster: APP_CLUSTER,
});
```

#### `disableStats` (deprecated) (Boolean)

Disables stats collection, so that connection metrics are not submitted to Pusher’s servers. These stats are used for internal monitoring only and they do not affect the account stats.
*This option is deprecated since stats collection is now disabled by default*

#### `enableStats` (Boolean)

Enables stats collection, so that connection metrics are submitted to Pusher’s servers. These stats can help pusher engineers debug connection issues.

#### `enabledTransports` (Array)

Specifies which transports should be used by pusher-js to establish a connection. Useful for applications running in controlled, well-behaving environments. Available transports for web: `ws`, `wss`, `xhr_streaming`, `xhr_polling`, `sockjs`. If you specify your transports in this way, you may miss out on new transports we add in the future.

```js
// Only use WebSockets
const pusher = new Pusher(APP_KEY, {
  cluster: APP_CLUSTER,
  enabledTransports: ['ws']
});
```

Note: if you intend to use secure websockets, or `wss`, you can not simply specify `wss` in `enabledTransports`, you must specify `ws` in `enabledTransports` as well as set the `forceTLS` option to `true`.

```js
// Only use secure WebSockets
const pusher = new Pusher(APP_KEY, {
  cluster: APP_CLUSTER,
  enabledTransports: ['ws'],
  forceTLS: true
});
```

#### `disabledTransports` (Array)

Specifies which transports must not be used by pusher-js to establish a connection. This settings overwrites transports whitelisted via the `enabledTransports` options. Available transports for web: `ws`, `wss`, `xhr_streaming`, `xhr_polling`, `sockjs`. This is a whitelist, so any new transports we introduce in the future will be used until you explicitly add them to this list.

```js
// Use all transports except for sockjs
const pusher = new Pusher(APP_KEY, {
  cluster: APP_CLUSTER,
  disabledTransports: ['sockjs']
});

// Only use WebSockets
const pusher = new Pusher(APP_KEY, {
  cluster: APP_CLUSTER,
  enabledTransports: ['ws', 'xhr_streaming'],
  disabledTransports: ['xhr_streaming']
});
```

#### `wsHost`, `wsPort`, `wssPort`, `httpHost`, `httpPort`, `httpsPort`

These can be changed to point to alternative Pusher Channels URLs (used internally for our staging server).

#### `wsPath`

Useful in special scenarios if you're using the library against an endpoint you control yourself. This is used internally for testing.

#### `ignoreNullOrigin` (Boolean)

Ignores null origin checks for HTTP fallbacks. Use with care, it should be disabled only if necessary (i.e. PhoneGap).

#### `activityTimeout` (Integer)

If there is no activity for this length of time (in milliseconds), the client will ping the server to check if the connection is still working. The default value is set by the server. Setting this value to be too low will result in unnecessary traffic.

#### `pongTimeout` (Integer)

Time before the connection is terminated after a ping is sent to the server. Default is 30000 (30s). Low values will cause false disconnections, if latency is high.

## Global configuration

### `Pusher.logToConsole` (Boolean)

Enables logging to the browser console via calls to `console.log`.

### `Pusher.log` (Function)

Assign a custom log handler for the pusher-js library logging. For example:

```js
Pusher.log = (msg) => {
  console.log(msg);
};
```

By setting the `log` property you also override the use of `Pusher.enableLogging`.

## Connection

A connection to Pusher Channels is established by providing your `APP_KEY` and `APP_CLUSTER` to the constructor function:

```js
const pusher = new Pusher(APP_KEY, {
  cluster: APP_CLUSTER,
});
```

This returns a pusher object which can then be used to subscribe to channels.

One reason this connection might fail is your account being over its' limits. You can detect this in the client by binding to the `error` event on the `pusher.connection` object. For example:

```js
const pusher = new Pusher('app_key');
pusher.connection.bind( 'error', function( err ) {
  if( err.error.data.code === 4004 ) {
    log('Over limit!');
  }
});
```

You may disconnect again by invoking the `disconnect` method:

```js
pusher.disconnect();
```

### Connection States
The connection can be in any one of these states.

**State**|**Note**
--- | ---
initialized|Initial state. No event is emitted in this state.
connecting|All dependencies have been loaded and Channels is trying to connect. The connection will also enter this state when it is trying to reconnect after a connection failure.
connected|The connection to Channels is open and authenticated with your app.
unavailable|The connection is temporarily unavailable. In most cases this means that there is no internet connection. It could also mean that Channels is down
failed|Channels is not supported by the browser. This implies that WebSockets are not natively available and an HTTP-based transport could not be found.
disconnected|The Channels connection was previously connected and has now intentionally been closed.

### Socket IDs

Making a connection provides the client with a new `socket_id` that is assigned by the server. This can be used to distinguish the client's own events. A change of state might otherwise be duplicated in the client. More information on this pattern is available [here](http://pusherapp.com/docs/duplicates).

It is also stored within the socket, and used as a token for generating signatures for private channels.

## Subscribing to channels

### Public channels

The default method for subscribing to a channel involves invoking the `subscribe` method of your pusher object:

```js
const channel = pusher.subscribe('my-channel');
```

This returns a Channel object which events can be bound to.

### Private channels

Private channels are created in exactly the same way as normal channels, except that they reside in the 'private-' namespace. This means prefixing the channel name:

```js
const channel = pusher.subscribe('private-my-channel');
```

### Encrypted Channels

Like private channels, encrypted channels have their own namespace, 'private-encrypted-'. For more information about encrypted channels, please see the [docs](https://pusher.com/docs/channels/using_channels/encrypted-channels).

```js
const channel = pusher.subscribe('private-encrypted-my-channel');
```

## Accessing Channels

It is possible to access channels by name, through the `channel` function:

```js
const channel = pusher.channel('private-my-channel');
```

It is possible to access all subscribed channels through the `allChannels` function:

```js
pusher.allChannels().forEach(channel => console.log(channel.name));
```

Private, presence and encrypted channels will make a request to your `channelAuthorization.endpoint` (`/pusher/auth`) by default, where you will have to [authorize the subscription](https://pusher.com/docs/authorizing_users). You will have to send back the correct authorization response and a 200 status code.

## Unsubscribing from channels

To unsubscribe from a channel, invoke the `unsubscribe` method of your pusher object:

```js
pusher.unsubscribe('my-channel');
```

Unsubscribing from private channels is done in exactly the same way, just with the additional `private-` prefix:

```js
pusher.unsubscribe('private-my-channel');
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

For client-events on presence channels, bound callbacks will be called with an additional argument. This argument is an object containing the `user_id` of the user who triggered the event

```
presenceChannel.bind('client-message', function (data, metadata) {
  console.log('received data from', metadata.user_id, ':', data);
});
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

## Triggering Client Events

It's possible to trigger [client events](https://pusher.com/docs/channels/using_channels/events#triggering-client-events) using the `trigger` method on an instance of the `Channel` class.

A few gotchas to consider when using client events:
- Client events can only be triggered on private/presence channels
- Client events must be enabled in the settings page for your app: `https://dashboard.pusher.com/apps/$YOUR_APP_ID/settings`
- The event name for client events *must* start with `client-`

```
channel.trigger('client-my-event', {message: 'Hello, world!'})
```


## Batching authorization requests (aka multi-authorization)

Currently, pusher-js itself does not support authorizing multiple channels in one HTTP request. However, thanks to @dirkbonhomme you can use the [pusher-js-auth](https://github.com/dirkbonhomme/pusher-js-auth) plugin that buffers subscription requests and sends authorization requests to your endpoint in batches.

## Default events

There are a number of events which are used internally, but can also be of use elsewhere, for instance `subscribe`. There is also a `state_change` event - which fires whenever there is a state change. You can use it like this:

```js
pusher.connection.bind('state_change', function(states) {
  // states = {previous: 'oldState', current: 'newState'}
  $('div#status').text("Channels current state is " + states.current);
});
```

## Connection Events

To listen for when you connect to Pusher Channels:

```js
pusher.connection.bind('connected', callback);
```

And to bind to disconnections:

```js
pusher.connection.bind('disconnected', callback);
```

## Self-serving JS files

You can host JavaScript files yourself, but it's a bit more complicated than putting them somewhere and just linking `pusher.js` in the source of your website. Because pusher-js loads fallback files dynamically, the dependency loader must be configured correctly or it will be using `js.pusher.com`.

First, clone this repository and run `npm install && git submodule init && git submodule update`. Then run:

    $ CDN_HTTP='http://your.http.url' CDN_HTTPS='https://your.https.url' make web

In the `dist/web` folder, you should see the files you need: `pusher.js`, `pusher.min.js`, `json2.js`, `json.min.js`, `sockjs.js` and `sockjs.min.js`. `pusher.js` should be built referencing your URLs as the dependency hosts.

First, make sure you expose all files from the `dist` directory. They need to be in a directory with named after the version number. For example, if you're hosting version 7.0.0 under `http://example.com/pusher-js` (and https for SSL), files should be accessible under following URL's:

    http://example.com/pusher-js/7.0.0/pusher.js
    http://example.com/pusher-js/7.0.0/json2.js
    http://example.com/pusher-js/7.0.0/sockjs.js

Minified files should have `.min` in their names, as in the `dist/web` directory:

    http://example.com/pusher-js/7.0.0/pusher.min.js
    http://example.com/pusher-js/7.0.0/json2.min.js
    http://example.com/pusher-js/7.0.0/sockjs.min.js

## SockJS compatibility

Most browsers have a limit of 6 simultaneous connections to a single domain, but Internet Explorer 6 and 7 have a limit of just 2. This means that you can only use a single Pusher Channels connection in these browsers, because SockJS requires an HTTP connection for incoming data and another one for sending. Opening the second connection will break the first one as the client won't be able to respond to ping messages and get disconnected eventually.

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

New to pusher-js 3.1 is the ability for the library to produce builds for different runtimes: classic web, NodeJS and
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

Then run:

```bash
make web
```

This will build the source files relevant for the web build into `dist/web`.

In order to specify the library version, you can either update `package.json` or pass a `VERSION` environment variable upon building.

Other build commands include:

```bash
make node         # for the NodeJS build
make worker       # for the worker build
```

### Testing

Each test environment contains two types of tests:

1. unit tests,
2. integration tests.

Unit tests are simple, fast and don't need any external dependencies. Integration tests usually connect to production and js-integration-api servers and can use a local server for loading JS files, so they need an Internet connection to work.

There are 3 different testing environments: one for web, one for NodeJS and one for workers.

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
