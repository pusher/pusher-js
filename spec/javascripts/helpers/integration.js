function describeIntegration(name, body) {
  if (navigator.userAgent.match(/phantomjs/i)) {
    // Don't run integration tests from Guard
    return;
  }
  describe(name + " (integration)", body);
}

Pusher.Integration = {};

Pusher.Integration.API_URL = "http://js-integration-api.pusher.com";
Pusher.Integration.API_EU_URL = "http://js-integration-api-eu.pusher.com";
Pusher.Integration.JS_HOST = "http://localhost:5555";

Pusher.Integration.ScriptReceivers = new Pusher.ScriptReceiverFactory(
  "_pusher_integration_script_receivers",
  "Pusher.Integration.ScriptReceivers"
);

Pusher.Integration.getRandomName = function(prefix) {
  return prefix + "_" + Pusher.Util.now() + "_" + Math.floor(Math.random() * 1000000);
};

Pusher.Integration.sendAPIMessage = function(request) {
  var jsonpRequest = new Pusher.JSONPRequest(request.url, {
    channel: request.channel,
    event: request.event,
    data: request.data
  });
  var receiver = Pusher.Integration.ScriptReceivers.create(function() {
    Pusher.Integration.ScriptReceivers.remove(receiver);
  });
  jsonpRequest.send(receiver);
};
