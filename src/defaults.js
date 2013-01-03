;(function() {
  Pusher.VERSION = '<VERSION>';

  // WS connection parameters
  Pusher.host = 'ws.pusherapp.com';
  Pusher.ws_port = 80;
  Pusher.wss_port = 443;
  // SockJS fallback parameters
  Pusher.sockjs_host = 'sockjs.pusher.com';
  Pusher.sockjs_http_port = 80;
  Pusher.sockjs_https_port = 443;
  Pusher.sockjs_path = "/pusher";
  // Stats
  Pusher.stats_host = 'stats.pusher.com';
  // Other settings
  Pusher.channel_auth_endpoint = '/pusher/auth';
  Pusher.cdn_http = '<CDN_HTTP>';
  Pusher.cdn_https = '<CDN_HTTPS>';
  Pusher.dependency_suffix = '<DEPENDENCY_SUFFIX>';
  Pusher.channel_auth_transport = 'ajax';
  Pusher.activity_timeout = 120000;
  Pusher.pong_timeout = 30000;
  Pusher.unavailable_timeout = 10000;

  Pusher.defaultStrategy = {
    type: "first_supported",
    host: "ws.pusherapp.com",
    unencryptedPort: 80,
    encryptedPort: 443,
    loop: true,
    timeoutLimit: 8000,
    children: [
      { type: "sequential",
        timeout: 2000,
        children: [
          { type: "transport", transport: "ws" },
          { type: "transport", transport: "ws", encrypted: true }
        ]
      },
      { type: "sequential",
        timeout: 5000,
        children: [
          { type: "transport", transport: "flash" },
          { type: "transport", transport: "flash", encrypted: true }
        ]
      },
      { type: "sequential",
        timeout: 2000,
        host: "sockjs.pusher.com",
        children: [
          { type: "transport", transport: "sockjs" },
          { type: "transport", transport: "sockjs", encrypted: true }
        ]
      }
    ]
  };
}).call(this);
