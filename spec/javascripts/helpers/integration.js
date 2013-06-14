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

Pusher.Integration.getRandomName = function(prefix) {
  return prefix + "_" + Pusher.Util.now() + "_" + Math.floor(Math.random() * 1000000);
};

Pusher.Integration.sendAPIMessage = function(request) {
  Pusher.JSONPRequest.send({
    data: {
      channel: request.channel,
      event: request.event,
      data: request.data
    },
    url: request.url,
    receiver: request.receiver || Pusher.JSONP
  }, function() {});
};
