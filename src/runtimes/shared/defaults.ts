var Defaults : any = {};

Defaults.VERSION = '3.0';
Defaults.PROTOCOL = 7;

// DEPRECATED: WS connection parameters
Defaults.host = 'ws.pusherapp.com';
Defaults.ws_port = 80;
Defaults.wss_port = 443;
// DEPRECATED: SockJS fallback parameters
Defaults.sockjs_host = 'sockjs.pusher.com';
Defaults.sockjs_http_port = 80;
Defaults.sockjs_https_port = 443;
Defaults.sockjs_path = "/pusher";
// DEPRECATED: Stats
Defaults.stats_host = 'stats.pusher.com';
// DEPRECATED: Other settings
Defaults.channel_auth_endpoint = '/pusher/auth';
Defaults.channel_auth_transport = 'ajax';
Defaults.activity_timeout = 120000;
Defaults.pong_timeout = 30000;
Defaults.unavailable_timeout = 10000;

// CDN configuration
Defaults.cdn_http = 'http://js.pusher.com';
Defaults.cdn_https = 'https://js.pusher.com';
Defaults.dependency_suffix = '';

export default Defaults;
