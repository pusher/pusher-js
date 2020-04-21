var Pusher = require('pusher_integration');
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
var integrationTestBuilder = require('./test_builder')

module.exports = function(testConfigs) {
  Integration.describe("Pusher", function() {
    // Integration tests in Jasmine need to have setup and teardown phases as
    // separate specs to make sure we share connections between actual specs.
    // This way we can also make sure connections are closed even when tests fail.
    //
    // Ideally, we'd have a separate connection per spec, but this introduces
    // significant delays and triggers security mechanisms in some browsers.

    var _VERSION;
    var _authTransport;
    var _authEndpoint;
    var _Dependencies;

    it("should prepare the global config", function() {
      // TODO fix how versions work in unit tests
      _VERSION = Defaults.VERSION;
      _authTransport = Defaults.authTransport;
      _authEndpoint = Defaults.authEndpoint;
      _Dependencies = Dependencies;

      Defaults.VERSION = "8.8.8";
      Defaults.authTransport = (TestEnv === 'web') ? 'jsonp' : 'ajax';
      Defaults.authEndpoint = Integration.API_URL + "/auth";

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

    for (testConfig of testConfigs) {
      integrationTestBuilder.build(testConfig)
    }


    it("should restore the global config", function() {
      Dependencies = _Dependencies;
      Defaults.authEndpoint = _authEndpoint;
      Defaults.authTransport = _authTransport;
      Defaults.VERSION = _VERSION;
    });
  });
}

