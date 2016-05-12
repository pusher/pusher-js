import Defaults from './defaults';

export var getGlobalConfig = function() {
  return {
    wsHost: Defaults.host,
    wsPort: Defaults.ws_port,
    wssPort: Defaults.wss_port,
    wsPath: Defaults.ws_path,
    httpHost: Defaults.sockjs_host,
    httpPort: Defaults.sockjs_http_port,
    httpsPort: Defaults.sockjs_https_port,
    httpPath: Defaults.sockjs_path,
    statsHost: Defaults.stats_host,
    authEndpoint: Defaults.channel_auth_endpoint,
    authTransport: Defaults.channel_auth_transport,
    // TODO make this consistent with other options in next major version
    activity_timeout: Defaults.activity_timeout,
    pong_timeout: Defaults.pong_timeout,
    unavailable_timeout: Defaults.unavailable_timeout
  };
};

export var getClusterConfig = function(clusterName) {
  return {
    wsHost: "ws-" + clusterName + ".pusher.com",
    httpHost: "sockjs-" + clusterName + ".pusher.com"
  };
};
