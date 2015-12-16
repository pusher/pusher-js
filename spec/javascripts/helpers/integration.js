var base64 = require('base64');
var util = require('util');

exports.API_URL = "http://js-integration-api.pusher.com";
exports.API_EU_URL = "http://js-integration-api-eu.pusher.com";
exports.JS_HOST = "http://localhost:5555";

exports.describe = function(name, body) {
  if (navigator.userAgent.match(/phantomjs/i)) {
    // Don't run integration tests from Guard
    return;
  }
  describe(name + " (integration)", body);
};

exports.getRandomName = function(prefix) {
  return prefix + "_" + util.now() + "_" + Math.floor(Math.random() * 1000000);
};

// FIXME implement an XHR endpoint
exports.sendAPIMessage = function(request) {
  var params = {
    channel: request.channel,
    event: request.event,
    data: request.data
  };
  var query = util.map(
    util.flatten(encodeParamsObject(params)),
    util.method("join", "=")
  ).join("&");

  url = request.url + ("/" + 2 + "?" + query); // TODO: check what to do in lieu of receiver number

  var xhr = util.createXHR();
  xhr.open("GET", url, true);
  xhr.send()
};

function encodeParamsObject(data) {
  return util.mapObject(data, function(value) {
    if (typeof value === "object") {
      value = JSON.stringify(value);
    }
    return encodeURIComponent(base64.encode(value.toString()));
  });
}
