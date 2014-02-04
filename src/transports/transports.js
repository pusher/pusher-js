(function() {
  Pusher.WSTransport = new Pusher.Transport({
    name: "ws",
    urls: Pusher.URLSchemes.ws,
    handlesActivityChecks: false,
    supportsPing: false,

    isSupported: function() {
      return window.WebSocket !== undefined ||
        window.MozWebSocket !== undefined;
    },
    getSocket: function(url) {
      var Constructor = window.WebSocket || window.MozWebSocket;
      return new Constructor(url);
    }
  });

  Pusher.FlashTransport = new Pusher.Transport({
    name: "flash",
    file: "flashfallback",
    urls: Pusher.URLSchemes.flash,
    handlesActivityChecks: false,
    supportsPing: false,

    isSupported: function() {
      try {
        return Boolean(new ActiveXObject('ShockwaveFlash.ShockwaveFlash'));
      } catch (e1) {
        try {
          return Boolean(
            navigator &&
            navigator.mimeTypes &&
            navigator.mimeTypes["application/x-shockwave-flash"] !== undefined
          );
        } catch (e2) {
          return false;
        }
      }
    },
    beforeInitialize: function() {
      if (window.WEB_SOCKET_SUPPRESS_CROSS_DOMAIN_SWF_ERROR === undefined) {
        window.WEB_SOCKET_SUPPRESS_CROSS_DOMAIN_SWF_ERROR = true;
      }
      window.WEB_SOCKET_SWF_LOCATION = Pusher.Dependencies.getRoot() +
        "/WebSocketMain.swf";
    },
    getSocket: function(url) {
      return new FlashWebSocket(url);
    }
  });

  var httpConfiguration = {
    urls: Pusher.URLSchemes.http,
    handlesActivityChecks: false,
    supportsPing: true
  };

  var streamingConfiguration = Pusher.Util.extend(
    { getSocket: function(url) {
        return Pusher.HTTP.getStreamingSocket(url);
      }
    },
    httpConfiguration
  );
  var pollingConfiguration = Pusher.Util.extend(
    { getSocket: function(url) {
        return Pusher.HTTP.getPollingSocket(url);
      }
    },
    httpConfiguration
  );

  var xhrConfiguration = {
    file: "xhr",
    isSupported: Pusher.Util.isXHRSupported
  };
  var xdrConfiguration = {
    file: "xdr",
    isSupported: function(environment) {
      return Pusher.Util.isXDRSupported(environment.encrypted);
    }
  };

  Pusher.XHRStreamingTransport = new Pusher.Transport(
    Pusher.Util.extend(
      { name: "xhr_streaming" },
      streamingConfiguration,
      xhrConfiguration
    )
  );
  Pusher.XDRStreamingTransport = new Pusher.Transport(
    Pusher.Util.extend(
      { name: "xdr_streaming" },
      streamingConfiguration,
      xdrConfiguration
    )
  );
  Pusher.XHRPollingTransport = new Pusher.Transport(
    Pusher.Util.extend(
      { name: "xhr_polling" },
      pollingConfiguration,
      xhrConfiguration
    )
  );
  Pusher.XDRPollingTransport = new Pusher.Transport(
    Pusher.Util.extend(
      { name: "xdr_polling" },
      pollingConfiguration,
      xdrConfiguration
    )
  );

  Pusher.SockJSTransport = new Pusher.Transport({
    name: "sockjs",
    file: "sockjs",
    urls: Pusher.URLSchemes.sockjs,
    handlesActivityChecks: true,
    supportsPing: false,

    isSupported: function() {
      return true;
    },
    getSocket: function(url, options) {
      return new SockJS(url, null, {
        js_path: Pusher.Dependencies.getPath("sockjs", {
          encrypted: options.encrypted
        }),
        ignore_null_origin: options.ignoreNullOrigin
      });
    },
    onOpen: function(transport, socket, path) {
      socket.send(JSON.stringify({
        path: path
      }));
      transport.changeState("open");
      socket.onopen = undefined;
    }
  });
}).call(this);
