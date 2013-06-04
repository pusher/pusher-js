;(function() {
  Pusher.getGlobalConfig = function() {
    return {
      wsHost: Pusher.host,
      wsPort: Pusher.ws_port,
      wssPort: Pusher.wss_port,
      httpHost: Pusher.sockjs_host,
      httpPort: Pusher.sockjs_http_port,
      httpsPort: Pusher.sockjs_https_port,
      httpPath: Pusher.sockjs_path,
      statsHost: Pusher.stats_host,
      authEndpoint: Pusher.channel_auth_endpoint,
      authTransport: Pusher.channel_auth_transport,
      // TODO make this consistent with other options in next major version
      activity_timeout: Pusher.activity_timeout,
      pong_timeout: Pusher.pong_timeout,
      unavailable_timeout: Pusher.unavailable_timeout
    };
  };

  Pusher.getClusterConfig = function(clusterName) {
    return {
      wsHost: "ws-" + clusterName + ".pusher.com",
      httpHost: "sockjs-" + clusterName + ".pusher.com"
    };
  };
}).call(this);
