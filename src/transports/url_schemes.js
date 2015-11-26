var Defaults = require('../defaults');

function getGenericURL(baseScheme, params, path) {
  var scheme = baseScheme + (params.encrypted ? "s" : "");
  var host = params.encrypted ? params.hostEncrypted : params.hostUnencrypted;
  return scheme + "://" + host + path;
}

function getGenericPath(key, queryString) {
  var path = "/app/" + key;
  var query =
    "?protocol=" + Defaults.PROTOCOL +
    "&client=js" +
    "&version=" + Defaults.VERSION +
    (queryString ? ("&" + queryString) : "");
  return path + query;
}

/** URL schemes for different transport types. */
module.exports = {
  /** Standard WebSocket URL scheme. */
  ws: {
    getInitial: function(key, params) {
      return getGenericURL("ws", params, getGenericPath(key, "flash=false"));
    }
  },
  /** SockJS URL scheme. Supplies the path separately from the initial URL. */
  sockjs: {
    getInitial: function(key, params) {
      return getGenericURL("http", params, params.httpPath || "/pusher", "");
    },
    getPath: function(key, params) {
      return getGenericPath(key);
    }
  },
  /** URL scheme for HTTP transports. Basically, WS scheme with a prefix. */
  http: {
    getInitial: function(key, params) {
      var path = (params.httpPath || "/pusher") + getGenericPath(key);
      return getGenericURL("http", params, path);
    }
  }
};
