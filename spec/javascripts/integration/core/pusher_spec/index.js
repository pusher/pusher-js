var Pusher = require('pusher_integration');
// var Pusher = require('core/pusher').default;
var TestEnv = require('testenv');

if (TestEnv === "web") {
  window.Pusher = Pusher;
  var DependencyLoader = require('dom/dependency_loader').default;
  var DependenciesReceivers = require('dom/dependencies').DependenciesReceivers;
  var Dependencies = require('dom/dependencies').Dependencies;
}

var Integration = require("integration");
var util = require("core/util").default;
var Timer = require("core/utils/timers").OneOffTimer;
var Collections = require('core/utils/collections');
var Defaults = require('core/defaults').default;
var Runtime = require('runtime').default;
var testBuilder = require('./test_builder')

Integration.describe("Pusher", function() {
  // Integration tests in Jasmine need to have setup and teardown phases as
  // separate specs to make sure we share connections between actual specs.
  // This way we can also make sure connections are closed even when tests fail.
  //
  // Ideally, we'd have a separate connection per spec, but this introduces
  // significant delays and triggers security mechanisms in some browsers.

  var _VERSION;
  var _channel_auth_transport;
  var _channel_auth_endpoint;
  var _Dependencies;

  it("should prepare the global config", function() {
    // TODO fix how versions work in unit tests
    _VERSION = Defaults.VERSION;
    _channel_auth_transport = Defaults.channel_auth_transport;
    _channel_auth_endpoint = Defaults.channel_auth_endpoint;
    _Dependencies = Dependencies;

    Defaults.VERSION = "8.8.8";
    Defaults.channel_auth_transport = (TestEnv === 'web') ? 'jsonp' : 'ajax';
    Defaults.channel_auth_endpoint = Integration.API_URL + "/auth";

    if (TestEnv === "web") {
      Dependencies = new DependencyLoader({
        cdn_http: Integration.JS_HOST,
        cdn_https: Integration.JS_HOST,
        version: Defaults.VERSION,
        suffix: "",
        receivers: DependenciesReceivers
      });
    }
  });

  // buildIntegrationTests("ws", false);
  testBuilder.buildIntegrationTests("ws", true);

  // if (Runtime.isXHRSupported()) {
  //   // CORS-compatible browsers
  //   if (TestEnv !== "web" || !/Android 2\./i.test(navigator.userAgent)) {
  //     // Android 2.x does a lot of buffering, which kills streaming
  //     buildIntegrationTests("xhr_streaming", false);
  //     buildIntegrationTests("xhr_streaming", true);
  //   }
  //   buildIntegrationTests("xhr_polling", false);
  //   buildIntegrationTests("xhr_polling", true);
  // } else if (Runtime.isXDRSupported(false)) {
  //   buildIntegrationTests("xdr_streaming", false);
  //   buildIntegrationTests("xdr_streaming", true);
  //   buildIntegrationTests("xdr_polling", false);
  //   buildIntegrationTests("xdr_polling", true);
  //   // IE can fall back to SockJS if protocols don't match
  //   // No SockJS TLS tests due to the way JS files are served
  //   buildIntegrationTests("sockjs", false);
  // } else {
  //   // Browsers using SockJS
  //   buildIntegrationTests("sockjs", false);
  //   buildIntegrationTests("sockjs", true);
  // }

  it("should restore the global config", function() {
    Dependencies = _Dependencies;
    Defaults.channel_auth_endpoint = _channel_auth_endpoint;
    Defaults.channel_auth_transport = _channel_auth_transport;
    Defaults.VERSION = _VERSION;
  });
});
