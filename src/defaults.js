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
  Pusher.stats_host = 'pusher-timeline.herokuapp.com';
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
      { type: "first_supported",
        children: [
          { type: "all_supported",
            children: [
              { type: "first_supported",
                children: [
                  { type: "sequential",
                    timeout: 4000,
                    children: [{ type: "transport", transport: "ws" }]
                  },
                  { type: "sequential",
                    timeout: 7000,
                    children: [{ type: "transport", transport: "flash" }]
                  }
                ]
              },
              { type: "delayed",
                delay: 2000,
                child: {
                  type: "transport",
                  transport: "sockjs",
                  host: "sockjs.pusher.com"
                }
              }
            ]
          },
          { type: "transport",
            transport: "sockjs",
            host: "sockjs.pusher.com"
          }
        ]
      }
    ]
  };
}).call(this);
