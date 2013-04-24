function describeIntegration(name, body) {
  if (navigator.userAgent.match(/phantomjs/i)) {
    // Don't run integration tests from Guard
    return;
  }
  describe(name + " (integration)", body);
}

Pusher.Integration = {};

Pusher.Integration.API_URL = "http://js-integration-api.pusher.com";
Pusher.Integration.JS_HOST = "http://localhost:5555";
