var Util = require('util');
var JSONPRequest = require('jsonp/jsonp_request');
var ScriptReceiverFactory = require('dom/script_receiver_factory');

function describeIntegration(name, body) {
  if (navigator.userAgent.match(/phantomjs/i)) {
    // Don't run integration tests from Guard
    return;
  }
  describe(name + " (integration)", body);
}

var Integration = {};

Integration.API_URL = "http://js-integration-api.pusher.com";
Integration.API_EU_URL = "http://js-integration-api-eu.pusher.com";
Integration.JS_HOST = "http://localhost:5555";

Integration.ScriptReceivers = new ScriptReceiverFactory(
  "_pusher_integration_script_receivers",
  "Pusher.Integration.ScriptReceivers"
);

Integration.getRandomName = function(prefix) {
  return prefix + "_" + Util.now() + "_" + Math.floor(Math.random() * 1000000);
};

Integration.sendAPIMessage = function(request) {
  var jsonpRequest = new JSONPRequest(request.url, {
    channel: request.channel,
    event: request.event,
    data: request.data
  });
  var receiver = Integration.ScriptReceivers.create(function() {
    Pusher.ScriptReceivers.remove(receiver);
  });
  jsonpRequest.send(receiver);
};

module.exports = Integration;
