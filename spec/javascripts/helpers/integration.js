var base64encode = require('base64').default;
var util = require('util').default;
var ScriptReceiverFactory = require('runtimes/dom/script_receiver_factory').ScriptReceiverFactory;
var Collections = require('utils/collections');
var JSONPRequest = require('runtimes/dom/jsonp_request').default;
var ScriptReceivers = require('runtimes/dom/script_receiver_factory').ScriptReceivers;
var Pusher = require('pusher_integration').default;

exports.API_URL = "http://pusher-js-integration-api.herokuapp.com";
exports.API_EU_URL = "http://pusher-js-integration-api-eu.herokuapp.com";

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

exports.sendAPIMessage = function(request) {
  var jsonpRequest = new JSONPRequest(request.url, {
    channel: request.channel,
    event: request.event,
    data: request.data
  });
  var receiver = Pusher.Integration.ScriptReceivers.create(function() {
    Pusher.Integration.ScriptReceivers.remove(receiver);
  });
  jsonpRequest.send(receiver);
};

// // FIXME implement an XHR endpoint
// exports.sendAPIMessage = function(request) {
//   var params = {
//     channel: request.channel,
//     event: request.event,
//     data: request.data
//   };
//   var query = Collections.map(
//     Collections.flatten(encodeParamsObject(params)),
//     Collections.method("join", "=")
//   ).join("&");
//
//   url = request.url + ("/" + 2 + "?" + query); // TODO: check what to do in lieu of receiver number
//
//   var xhr = util.createXHR();
//   xhr.open("GET", url, true);
//   xhr.send()
// };

function encodeParamsObject(data) {
  return Collections.mapObject(data, function(value) {
    if (typeof value === "object") {
      value = JSON.stringify(value);
    }
    return encodeURIComponent(base64.encode(value.toString()));
  });
}
