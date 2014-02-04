(function() {
  function getGenericURL(baseScheme, params, path) {
    var scheme = baseScheme + (params.encrypted ? "s" : "");
    var host = params.encrypted ? params.hostEncrypted : params.hostUnencrypted;
    return scheme + "://" + host + path;
  }

  function getGenericPath(key, queryString) {
    var path = "/app/" + key;
    var query =
      "?protocol=" + Pusher.PROTOCOL +
      "&client=js" +
      "&version=" + Pusher.VERSION +
      (queryString ? ("&" + queryString) : "");
    return path + query;
  }

  Pusher.URLSchemes = {
    ws: {
      getInitial: function(key, params) {
        return getGenericURL("ws", params, getGenericPath(key, "flash=false"));
      }
    },
    flash: {
      getInitial: function(key, params) {
        return getGenericURL("ws", params, getGenericPath(key, "flash=true"));
      }
    },
    sockjs: {
      getInitial: function(key, params) {
        return getGenericURL("http", params, params.httpPath || "/pusher", "")
      },
      getPath: function(key, params) {
        return getGenericPath(key);
      }
    },
    http: {
      getInitial: function(key, params) {
        var path = (params.httpPath || "/pusher") + getGenericPath(key);
        return getGenericURL("http", params, path)
      }
    }
  };
}).call(this);
