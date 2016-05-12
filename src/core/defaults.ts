export interface DefaultConfig {
  VERSION: string;
  PROTOCOL: number;
  host: string;
  ws_port: number;
  wss_port: number;
  ws_path: string;
  sockjs_host: string;
  sockjs_http_port: number;
  sockjs_https_port: number;
  sockjs_path: string;
  stats_host: string;
  channel_auth_endpoint: string;
  channel_auth_transport: string;
  activity_timeout: number;
  pong_timeout: number;
  unavailable_timeout: number;

  cdn_http?: string;
  cdn_https?: string;
  dependency_suffix?: string;
}

var Defaults : DefaultConfig = {
  VERSION: "<VERSION>",
  PROTOCOL: 7,

  // DEPRECATED: WS connection parameters
  host: 'ws.pusherapp.com',
  ws_port: 80,
  wss_port: 443,
  ws_path: '',
  // DEPRECATED: SockJS fallback parameters
  sockjs_host: 'sockjs.pusher.com',
  sockjs_http_port: 80,
  sockjs_https_port: 443,
  sockjs_path: "/pusher",
  // DEPRECATED: Stats
  stats_host: 'stats.pusher.com',
  // DEPRECATED: Other settings
  channel_auth_endpoint: '/pusher/auth',
  channel_auth_transport: 'ajax',
  activity_timeout: 120000,
  pong_timeout: 30000,
  unavailable_timeout: 10000,

  // CDN configuration
  cdn_http: '<CDN_HTTP>',
  cdn_https: '<CDN_HTTPS>',
  dependency_suffix: '<DEPENDENCY_SUFFIX>'
}

export default Defaults;
