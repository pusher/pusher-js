var base64encode = require('core/base64').default;
var Runtime = require('runtime').default
var Collections = require('core/utils/collections');
var util = require('core/util').default;

exports.API_URL = "http://pusher-js-integration-api.herokuapp.com";
exports.API_EU_URL = "http://pusher-js-integration-api-eu.herokuapp.com";

exports.describe = function(name, body) {
  describe(name + " (integration)", body);
};

exports.getRandomName = function(prefix) {
  return prefix + "_" + util.now() + "_" + Math.floor(Math.random() * 1000000);
};

exports.sendAPIMessage = function(request) {
  var params = {
    channel: request.channel,
    event: request.event,
    data: request.data
  };

  var query = Collections.map(
    Collections.flatten(Collections.encodeParamsObject(params)),
    util.method("join", "=")
  ).join("&");

  url = request.url + ("/" + 2 + "?" + query);
  var xhr = Runtime.createXHR();
  xhr.open("GET", url, true);
  xhr.send()
};
