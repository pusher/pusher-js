# Changelog

## 8.4.0-rc2

- [FIXED] Persist Initial Pusher Options
- [FIXED] Authorization Custom Handler typing https://github.com/pusher/pusher-js/issues/715

## 8.4.0-rc1

- [Added] Introduce a new  method to switch the Pusher client to a different cluster and re-establish all existing subscriptions and channel bindings.

## 8.3.0

- [CHANGED] Update cached re-connect strategy to prioritize WebSocket

## 8.2.0

- [CHANGED] Remove WebSocket retry limit.

## 8.1.0

- [CHANGED] Move @types dependencies to devDependencies
- [CHANGED] Upgrade typescript to 5.1.3

## 8.0.2

- [CHANGED] Fix React Native support.

## 8.0.1

- [FIXED] Fix 'window is not defined' error in the worker context
- [FIXED] Specify the right status when an error is thrown for the pusher worker instance

## 8.0.0

- [CHANGED] Specifying a cluster when instantiating the Pusher object is now mandatory. An exception is thrown if the cluster setting is missing.

## 7.6.0

- [ADDED] Introduce headersProvider and paramsProvider to channel authorization and user authentication in order to allow for changing header and param values after the Pusher object is initialized.

## 7.5.0

- [ADDED] Watchlist Online Status

## 7.4.1

- [CHANGED] Authorization error message.

## 7.4.0

* [CHANGED] Use secure random generator instead of pseudo-random generator
* [CHANGED] Replace git protocol with HTTPS in gitsubmodules file
* [ADDED] Allow presence channel authorization to depend on user authentication

## 7.3.0

* [FIXED] Restore previously exported types

## 7.2.0

* [ADDED] Add support for subscription_count event

## 7.1.1-beta

[FIXED] Exported Typescript types in index.d.ts

## 7.1.0-beta

[ADDED] Support for authenticating users with the `signin` method

[ADDED] Support for binding to events sent to a specific authenticated user

[UPDATED] The initialization of the `Pusher` object has been changed. Two new parameters were introduced: `userAuthentication` and `channelAuthorization`.

[DEPRECATED] The Pusher object parameters `auth`, `authEndpoint`, and `authTransport` are still supported, but deprecated. They have been replaced with the `channelAuthorization` parameter.

## 7.0.6

* [FIXED] pusher-js/worker can now be bundled and used in a web worker context

## 7.0.5

* [FIXED] pusher-js/worker is now built by webpack with umd libraryTarget, which
allows it to be bundled as described in the README

## 7.0.4

* [FIXED] References to nonexistent source map #570

## 7.0.3 (2021-01-25)

[UPDATED] Bumped version of faye-websocket (used only by the node runtime) from
0.9.4 to 0.11.3. Thanks to @Akhawais for the PR.

[UPDATED] Bumped version of @react-native-community/netinfo (used only by the
react-native runtime) from 4.1.1 to 5.9.7. Thanks to @Yinabled for the PR.

[ADDED] We were missing a react-native key in `package.json`. Thanks to @giaset
for the PR

[ADDED] Support for importing the worker builds (solving issue #499)

## 7.0.2 (2020-11-26)

[FIXED] Removes `AuthInfo` type from react-native and with-encryption builds.
This type was removed everywhere else in v7.0.0. See [issue
512](https://github.com/pusher/pusher-js/issues/512)

## 7.0.1 (2020-11-02)

[FIXED] Channels no longer get stuck in the `subscriptionPending` state
after a failed request to an auth endpoint. [Fixes Issue
255](https://github.com/pusher/pusher-js/issues/255)

## 7.0.0 (2020-07-30)

[UPDATED] Type signatures for authorizer callback. Previously the authorizer
callback had 2 arguments, the first was a boolean indicating that the second
was an error. Switched for a more conventional `function(err, data)` signature.
**This is a breaking change, if you use a custom authorizer**

[UPDATED] Types of errors emitted on `pusher:subscription_error` events.
Previously this event just contained the status code the auth endpoint
returned. This was replaced with a (hopefully) more error object with a message
and a `status` key.
**This is a breaking change, if you depend on the status in the
`pusher:subscription_error` event**

[FIXED] Stop wrapping websocket errors multiple times. [Fixes issue
464](https://github.com/pusher/pusher-js/issues/464)
**This might be a breaking change, if you depend on the structure of `'error'` events
emitted by `pusher.connection`**

[FIXED] Stop swallowing errors thrown by handlers on encrypted channels.
Previously errors thrown by handlers bound to encrypted channels were caught
and ignored. This was unintentional and undesirable. [Fixes Issue
437](https://github.com/pusher/pusher-js/issues/437)

## 6.0.3 (2020-05-14)

[FIXED] Added typescript declarations for the pusher-js/with-encryption build

[REMOVED] Unnecessary dummy tweetnacl types for react-native (thanks to
@dmitrybirin)

[UPDATED] Copyright years (thanks to @annzenkina)

## 6.0.2 (2020-04-30)

[FIXED] React-native import broken in release 6.0.1

## 6.0.1 (2020-04-30)

[CHANGED] Moved tweetnacl from `devDependencies` to `dependencies`. No
additional code is included in the bundle, but this gives the typescript
compiler access to the tweetnacl types

[FIXED] Typescript declarations for react-native. These were supposed to be
included in 6.0.0 but the commit was missed

## 6.0.0 (2020-04-27)

[CHANGED] The default builds for web and worker no longer support encrypted
channels. To use encrypted channels in web/worker you must import
`pusher-js/with-encryption` or use the
`pusher-with-encryption.js`/`pusher-with-encryption.min.js` bundles

[CHANGED] `forceTLS` now defaults to `true`

[REMOVED] the `encrypted` option - this was deprecated in `4.3.0`. The library
defaults to TLS anyway. Setting `encrypted` to `false` will **NOT** change
behaviour

[FIXED] `activityTimeout` and `pongTimeout` options now work as described in
the docs.

[NEW] Typescript declarations for react-native

[NEW] Support for encrypted-channels in react-native and workers

## 5.1.1 (2020-02-12)

[FIXED] An issue with typescript declarations which caused builds to fail on
typescript projects dependent on pusher-js

## 5.1.0 (2020-02-11)

[NEW] Include typescript declarations

[CHANGED] Make stats opt in rather than opt out - Previously we sent some
metrics about connection strategies to stats.pusher.com by default, it could be
disabled by passing the `disableStats` option. This functionality is now off by
default and can be enabled by passing the `enableStats` option

[FIXED] An issue where local tests would hang for 300s if a browser wasn't
available

## 5.0.3 (2019-11-18)

[NEW] Log a warning when there is an auth error

[CHANGED] Default logger now uses console.warn and console.error

[CHANGED] Improved log messages

## 5.0.2 (2019-09-25)

[FIXED] Utilise new API for @react-native-community/netinfo suppressing
deprecation warnings

[CHANGED] output an ES6 module from typescript to allow webpack to optimise the
bundle more effectively (thanks to @stof for this change)

[CHANGED] Use prettier to format source

## 5.0.1 (2019-09-02)

[FIXED] We no longer include an unnecessary Buffer polyfill in bundles

## 5.0.0 (2019-07-19)

This is a major version bump but should only contain breaking change for
react-native users.

[CHANGED] The react-native build now assumes @react-native-community/netinfo is
available in the host project. This change was necessary since netinfo was
removed from react-native core.

[CHANGED] The reconnect strategy is no longer built with a DSL. This makes the
code much more easily optimised by the javascript engine and should improve
load times significantly. Thanks to @stof for his contribution.

[CHANGED] The project is now built with recent versions of webpack and
typescript. All other build deps were updated and the build process was
simplified.

[FIXED] An issue that broke encrypted channels in node has been resolved

[FIXED] Some consistently flaky tests were fixed and we switched to headless
browsers for test runs where possible (including in CI).

[CHANGED] The node dependencies are now bundled in the node dist file so that
web/react-native users don't need to install unnecessary dependencies

## 4.4.0 (2019-02-14)

[NEW] Callbacks bound to client events on presence channels will be called with an extra argument containing the `user_id` of the message sender

[NEW] Warn when trying to trigger client-events to a channel that isn't subscribed

## 4.3.1 (2018-09-03)

[FIXED] Honour protocol error codes received after connection succeeds

## 4.3.0 (2018-08-13)

[NEW] This release adds support for end to end encrypted channels, a new feature for Channels. Read more [in our docs](https://pusher.com/docs/client_api_guide/client_encrypted_channels).

[DEPRECATED] Renamed `encrypted` option to `forceTLS` - `encrypted` will still work!

## 4.2.2 (2018-01-04)

[FIXED] Do not warn about a missing cluster when the host is explicitly set.

[FIXED] Only log with a custom logger when configured (prevents double
logging).

[FIXED] Update React Native NetInfo usage due to deprecated modules.

[NEW] Add `wsPath` option (see README.md for details).

Many thanks to @sunweiyang, @rajivm and @WillSewell for their contributions!

## 4.2.1 (2017-09-28)

[FIXED] Correct version numbers in file headers (v4.2.0 still showed 4.1.0).

## 4.2.0 (2017-09-28)

[FIXED] Fixed an issue where pusher-js would not attempt to subscribe to
channels that were in the process of being subscribed to when the connection
failed.

[FIXED] Does not attempt to call `handlesActivityChecks` on an undefined
connection instance anymore. Fixes issues #82 and #233.

[NEW] More helpful error messages can now be logged, with URLs.

[CHANGED] Various improvements in README.md.

Many thanks to @hengwoon, @leesio, @juliangruber and Heng for their
contributions to this release!

## 4.1.0 (2017-04-20)

[NEW] Enable custom authorizers. For more information,
[see here](https://github.com/pusher/pusher-js#authorizer-function).

[NEW] Send credentials with Fetch requests in workers.

[NEW] Replace main file with Node.js version and add new browser field. This
also makes `require('pusher-js')` work out of the box.

[FIXED] Change `.done` to `.then` in React Native.

[FIXED] Include minified files when installing with Bower.

[CHANGED] Change `pusher` to `socket` for instance names in the readme.

Many thanks to @ejlangev, @piperchester, @wawyed, @mgalgs, @jamesfisher,
@kubik369 & @mrbabbs for their contributions to this release!

## 4.0.0 (2016-12-01)

New major version released due to breaking changes.

[CHANGED] rename bind_all to bind_global

[NEW] unbind_global to remove global bindings

[CHANGED] unbind_all now removes global bindings as well as event specific

[NEW] expose context to pusher level bindings

## 3.2.4 (2016-10-29)

[FIXED] Subscriptions are reinstated correctly after a disconnection and
reconnection. Regression introduced in 3.2.3.

## 3.2.3 (2016-10-22)

[NEW] Cancelled subscriptions are now re-instated on subsequent `subscribe`
calls, allowing arbitrary chains of `subscribe`/`unsubscribe` calls, where the
final method is always respected regardless of the timings.
See [PR 201](https://github.com/pusher/pusher-js/pull/201) for details.

## 3.2.2 (2016-10-03)

[FIXED] Fix unsubscribe behaviour while subscription is pending (thanks to @hot-leaf-juice).

## 3.2.1 (2016-08-02)

[FIXED] Removes instances of evalling for global scope in timers module.

## 3.2.0 (2016-08-01)

[FIXED] CSP Issue with 3.1 in Chrome extension background context. #168

[FIXED] Stringifying circular JSON structures for React Native. #182

[NEW] Add a new global unbind method.

[INTERNAL] Uses webpack define plugin to specify the global for each runtime.

## 3.1.0 (2016-05-08)

[NEW] New builds for ReactNative, NodeJS and Web Workers. The first two are available on NPM. The last is available as a download.

[FIXED] The library no longer swallows connected exceptions. (#105)

[FIXED] Callback removal issues in Safari 9 (#125 #129)

[CHANGED] Monkey-patching the DependencyLoader when self-hosting no longer supported. New steps in README.

[CHANGED] HTTP fallbacks are now included as part of the main file and are not therefore dynamically loaded.

[INTERNAL] Ported to TypeScript.

[INTERNAL] The library is split into a core directory and a runtimes directory to make a separation between platform-independent and platform-specific code.

[INTERNAL] Uses Webpack as a bundler.

[INTERNAL] Testing suites for NodeJS and workers.

[INTERNAL] TravisCI + Browserstack setup.

[INTERNAL] NodeJS and ReactNative builds use XMLHttpRequest polyfills for authorization and session timelines. Workers use the `fetch` API.

## 3.1.0-pre

[NEW] Added Pusher.logToConsole to log to console as a short-hand for writing a Pusher.log function to do so

## 3.0.0 (2015-04-23)

[NEW] Introduce package.json, pusher-js will be published on NPM !

[NEW] added header/footer for UMD, allows CommonJS loaders to use pusher-js

[CHANGED] Remove the Flash fallback

[FIXED] double-unsubscribe is now idempotent

[FIXED] Serve only distribution files via Bower

[INTERNAL] Cleaned up a lot of the build process, makes contributing easier

## 2.2.4 (2015-02-13)

[FIXED] Dependency loader not using HTTPS for encrypted connections on pages loaded via HTTP

## 2.2.3 (2014-09-10)

[FIXED] Wrong encoding of HTTP heartbeats

[FIXED] Missing httpPath parameter for sockjs transport

[FIXED] Auth query strings no longer start with `&`

## 2.2.2 (2014-06-09)

[CHANGED] Updated the HTTPS CDN URL to `https://js.pusher.com`

## 2.2.1 (2014-05-28)

[FIXED] Exception triggered by ping being sent when disconnected

## 2.2.0 (2014-04-14)

No changes since 2.2.0-rc3, just changed the version number.

## 2.2.0-rc3 (2014-03-26)

[NEW] Added third argument to the bind method on event emitters to allow binding of context to callbacks

[CHANGED] Changed the primary WebSocket fallback to WSS instead of HTTP

[FIXED] Exception when aborting timers, which caused infinite connection loop on IE8

## 2.2.0-rc2 (2014-02-25)

[NEW] Dependency loader will retry fetching additional resources if they fail to load

[CHANGED] Refactored internals to reduce main file size by over 1KB

[CHANGED] Improved heartbeat handling for HTTP transports

[CHANGED] Removed wssHost and httpsHost options, reverted to a single domain regardless of encryption

[CHANGED] Added extra 1s to the cached transport timeout

[CHANGED] Updated the stats protocol

[FIXED] MozWebSocket is not assigned to WebSocket anymore

[FIXED] Socket listeners are always unbound after closing the connection

## 2.2.0-rc1 (2014-01-14)

[NEW] XHR streaming and polling transports were extracted from SockJS

[NEW] Reduced the number of roundtrips required by HTTP streaming and polling transports for connecting from 3 to 1

[NEW] Refactored the connection strategy to be faster and more reliable for clients using HTTP

[NEW] Added new options - `wssHost` and `httpsHost` for encrypted connections

[NEW] HTTP streaming and polling are now supported on Opera

[CHANGED] Reduced the size of sockjs.js

[FIXED] Issue with SockJS streaming not being able to reconnect

## 2.1.6 (2014-01-09)

[NEW] Ping on offline events to detect disconnections quicker

[CHANGED] Added an exception when handshake does not contain the activity timeout

[FIXED] Encrypted transports not being cached correctly

## 2.1.5 (2013-12-16)

[NEW] Server can suggest a lower activity timeout in the handshake

[CHANGED] Updated the protocol to version 7

[CHANGED] Transports are cached separately for encrypted connections

[CHANGED] Updated the stats protocol

[FIXED] Removed the `Protocol` variable leaking into the global scope

[FIXED] Flash check was occasionally raising exceptions on old Firefox releases

## 2.1.4 (2013-11-26)

[NEW] Added the `Pusher.prototype.allChannels` method

[NEW] Implemented the `enabledTransports` option

[NEW] Implemented the `disabledTransports` option

[CHANGED] Connections are not closed anymore after receiving an offline event

[CHANGED] Connections are still attempted, even if the browser indicates it's offline

[CHANGED] When not connected, an online event will trigger a new connection attempt immediately

[CHANGED] Updated the stats protocol

## 2.1.3 (2013-10-21)

[CHANGED] Updated the json2 library

[FIXED] Catch exceptions when accessing localStorage and parsing its contents

[FIXED] Flush transport cache if it's corrupted

[FIXED] Stop raising exceptions when stats requests fail

[CHANGED] Don't report stats when offline

[CHANGED] Raise an error when trying to send a client event without the `client-` prefix

## 2.1.2 (2013-08-09)

[FIXED] Race condition in SockJS heartbeats

[FIXED] Exception in dependency loader when a file happens to be loaded twice

[CHANGED] Improved metric reporting

## 2.1.1 (2013-07-08)

[FIXED] Disable transports that raise protocol errors

[FIXED] Keep trying all transports if a handshake raises an error

[CHANGED] Send less verbose error and closed event logs to stats

[FIXED] Add missing `connecting_in` event

[FIXED] Catch exceptions raised when accessing `window.localStorage` in some environments

## 2.1.0 (2013-06-17)

[NEW] Added support for clusters

[CHANGED] All configuration options can be passed to the Pusher constructor

[DEPRECATED] Global configuration options should not be used anymore

[FIXED] SockJS issues on some versions of Opera

## 2.0.5 (2013-05-28)

[FIXED] Working connections being closed when a parallel handshake failed in a specific way

[CHANGED] Warnings are always sent to Pusher.log if it's available

[FIXED] Handshake errors not being emitted

[FIXED] Authorizing two connections simultaneously to the same channel using JSONP

[CHANGED] Sending more detailed connection logs

## 2.0.4 (2013-04-26)

[FIXED] Exception when WebSocket was closed uncleanly immediately after opening

[FIXED] Removed SockJS exception when receiving a handshake after closing the connection

## 2.0.3 (2013-04-24)

[CHANGED] Transports are now considered working only after getting an initial message

[NEW] Added `ignoreNullOrigin` flag to Pusher constructor to ignore null origin checks in SockJS for PhoneGap

[FIXED] Exceptions in private browsing mode on (Mobile) Safari while caching transport info

[FIXED] Unbinding callback that hasn't been bound caused removal of last registered callback

[FIXED] Exceptions while closing connections in Safari

## 2.0.2 (2013-04-16)

[FIXED] WebSockets not being disabled after rapid, unclean disconnections

## 2.0.1 (2013-04-11)

[FIXED] Issues with disabling Flash transport

[FIXED] Error while checking for Flash support in some environments

[FIXED] Race condition on disconnections and retries

[FIXED] Reporting errors when connection was closed correctly

## 2.0.0 (2013-03-19)

[CHANGED] Completely redesigned connection strategy

[CHANGED] HTTP fallbacks (built using SockJS) are now used if WebSockets and Flash transports both fail to connect (previously only used if neither WebSockets nor Flash were supported)

[NEW] Connection metrics are now submitted to Pusher's stats service

[NEW] Added disableFlash boolean option to Pusher constructor

[CHANGED] Updated web-socket-js and sockjs-client libraries

[FIXED] Improved HTTP fallback reliability

## 1.12.7 (2013-02-25)

[CHANGED] Various improvements and fixes for HTTP fallbacks

## 1.12.6 (2013-02-19)

[CHANGED] Flash is now detected before fetching fallback files

[CHANGED] Empty app key are now raising warnings

[FIXED] Fixed local variable leak

[FIXED] Reconnecting caused pusher:subscription_succeeded to be emitted more than once

## 1.12.5 (2012-10-31)

[CHANGED] Improved connection timeout strategy.

## 1.12.4 (2012-10-08)

[NEW] Added experimental fallback used when Flash fallback fails.

## 1.12.3 (2012-10-01)

[FIXED] Error when Flash fallback files are served cross-domain.

## 1.12.2 (2012-07-18)

[FIXED] Issues with Flash fallback when port 843 is blocked.

[FIXED] Binding to events with names of Object's native methods.

## 1.12.1 (2012-05-03)

[CHANGED] The error argument passed into `socket.onerror()` is included with the error emitted to the user.

[FIXED] impermanentlyClosing to impermanentlyClosing state machine transition.

## 1.12.0 (2012-04-14)

[NEW] Use `channel.members.me` to get the id and info for the local presence user.  See the docs for more information: http://pusher.com/docs

[NEW] Send extra headers and query parameters with the private/presence channel authentication requests sent to your server.  This is useful for, amongst other things, frameworks that require cross-site request forgery validation.  See the docs for more information: http://pusher.com/docs

[FIXED] `channel.subscribed` not set to `false` when `disconnect` event occurs on the connection.

[UPGRADE] The linked version of web-socket-js. This includes a switch to the WebSocket version defined in RFC 6455.  For the full list of changes in web-socket-js, see <https://github.com/gimite/web-socket-js/compare/bb5797cad5244dc86410e35726ef886bbc49afe9...2ee87e910e92f2366d562efebbbec96349924df3>.

[REMOVED] `channel.members.add()`, `channel.members.remove()` and `channel.members.clear()`.

## 1.11.2 (2012-03-15)

[FIXED] Mobile Safari crashing after receiving data on closed connection.

[FIXED] Attempt to transition from impermanentlyClosing to connected.

## 1.11.1 (2012-03-09)

[NEW] Unit tests run twice as fast.

[CHANGED] The reconnection attempt following a dropped connection will happen a minimum of one second after the connection was previously established.

[FIXED] Calling connect after some failed connection attempts means the attempt to connect is delayed.

[FIXED] Connection closing after calling disconnect is not emitted to the developer.

## 1.11.0 (2012-01-03)

[NEW] You can now unbind from an event.

[NEW] Internal errors are now logged with `console.error` if available. You can override this behaviour by modifying the `Pusher.warn` function.

[NEW] Warning logged to `console.error` in the following cases: no api key supplied to initialiser, authentication failure connecting to private/presence channel, attempt to connect using `ws://` for application which have designated themselves as secure only, or unexpected errors returned by Pusher.

[NEW] Stale connections between the Pusher client and server are now detected and re-established.

[CHANGED] You may no longer bind to pusher_internal events.

[REMOVED] Pusher.Channel.is_private

[REMOVED] Pusher.Channel.is_presence

## 1.10.1 (2011-12-1)

[NEW] Changed `channel.trigger()` to return a boolean indicating whether the message was actually sent.

[NEW] Private and public channels now emit `pusher:subscription_succeeded` events.  This is consistent with presence channels.

[CHANGED] Renamed the `subscription_error` event to `pusher:subscription_error`.

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
