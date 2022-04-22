const TestEnv = require('testenv');
const Pusher = require('pusher_integration');
const DependenciesModule = require('dom/dependencies');
const DependenciesReceiversModule = require('dom/dependency_loader');
const waitsFor = require('../../helpers/waitsFor');

if (TestEnv === "web") {
  window.Pusher = Pusher;
  var DependenciesReceivers = DependenciesModule.DependenciesReceivers;
  var Dependencies = DependenciesModule.Dependencies;
  var DependencyLoader = DependenciesReceiversModule.default;
}

const Integration = require("integration");
const Collections = require("core/utils/collections");
const Runtime = require('runtime').default;
const Defaults = require('core/defaults').default;
const TRANSPORTS = Runtime.Transports;


module.exports = function(testConfigs) {
  Integration.describe("Cluster Configuration", function() {
    var pusher;

    function subscribe(pusher, channelName, callback) {
      var channel = pusher.subscribe(channelName);
      channel.bind("pusher:subscription_succeeded", function(param) {
        callback(channel, param);
      });
      return channel;
    }


    function describeClusterTest(options) {
      var environment = { forceTLS: options.forceTLS };
      if (!TRANSPORTS[options.transport].isSupported(environment)) {
        return;
      }

      describe("with " + options.transport + ", forceTLS=" + options.forceTLS, function() {
        var jasmineDefaultTimeout = jasmine.DEFAULT_TIMEOUT_INTERVAL;

        beforeAll(() => {
          jasmine.DEFAULT_TIMEOUT_INTERVAL = 21000;
        });

        afterAll(() => {
          jasmine.DEFAULT_TIMEOUT_INTERVAL = jasmineDefaultTimeout;
        });

        beforeEach(function() {
          Collections.objectApply(TRANSPORTS, function(transport, name) {
            spyOn(transport, "isSupported").and.returnValue(false);
          });
          TRANSPORTS[options.transport].isSupported.and.returnValue(true);
          spyOn(Runtime, "getLocalStorage").and.returnValue({});
        });

        it("should open a connection to the 'eu' cluster", async function() {
          var authTransport = (TestEnv === "web") ? 'jsonp' : 'ajax';

          pusher = new Pusher("4d31fbea7080e3b4bf6d", {
            authTransport: authTransport,
            authEndpoint: Integration.API_EU_URL + "/auth",
            cluster: "eu",
            forceTLS: options.forceTLS,
          });

          await waitsFor(function() {
            return pusher.connection.state === "connected";
          }, "connection to be established", 20000);

          expect(pusher.connection.state).toEqual('connected');
        });

        it("should subscribe and receive a message sent via REST API", async function() {
          var channelName = Integration.getRandomName("private-integration");

          var onSubscribed = jasmine.createSpy("onSubscribed");
          var channel = subscribe(pusher, channelName, onSubscribed);

          var eventName = "integration_event";
          var data = { x: 1, y: "z" };
          var received = null;

          await waitsFor(function() {
            return onSubscribed.calls.count();
          }, "subscription to succeed", 10000);

          channel.bind(eventName, function(message) {
            received = message;
          });
          Integration.sendAPIMessage({
            url: Integration.API_EU_URL + "/v2/send",
            channel: channelName,
            event: eventName,
            data: data
          });

          await waitsFor(function() {
            return received !== null;
          }, "message to get delivered", 10000);

          expect(received).toEqual(data);
          pusher.unsubscribe(channelName);
        });

        it("should disconnect the connection", function() {
          pusher.disconnect();
        });
      });
    }

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
      Defaults.authTransport = "";
      Defaults.authEndpoint = "";

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
      describeClusterTest(testConfig)
    }


    it("should restore the global config", function() {
      Dependencies = _Dependencies;
      Defaults.authEndpoint = _authEndpoint;
      Defaults.authTransport = _authTransport;
      Defaults.VERSION = _VERSION;
    });
  });
}
