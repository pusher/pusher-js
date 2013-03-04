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

  Pusher.getDefaultStrategy = function() {
    return [
      [":def", "ws_hosts", {
        hostUnencrypted: Pusher.host + ":" + Pusher.ws_port,
        hostEncrypted: Pusher.host + ":" + Pusher.wss_port
      }],
      [":def", "sockjs_hosts", {
        hostUnencrypted: Pusher.sockjs_host + ":" + Pusher.sockjs_http_port,
        hostEncrypted: Pusher.sockjs_host + ":" + Pusher.sockjs_https_port
      }],
      [":def", "timeouts", {
        loop: true,
        timeout: 15000,
        timeoutLimit: 60000
      }],

      [":def_transport", "ws", "ws", 3, ":ws_hosts"],
      [":def_transport", "flash", "flash", 2, ":ws_hosts"],
      [":def_transport", "sockjs", "sockjs", 1, ":sockjs_hosts"],
      [":def", "ws_loop", [":sequential", ":timeouts", ":ws"]],
      [":def", "flash_loop", [":sequential", ":timeouts", ":flash"]],
      [":def", "sockjs_loop", [":sequential", ":timeouts", ":sockjs"]],

      [":def", "strategy",
        [":cached", 1800000,
          [":first_connected",
            [":if", [":is_supported", ":ws"], [
                ":best_connected_ever", ":ws_loop", [":delayed", 2000, [":sockjs_loop"]]
              ], [":if", [":is_supported", ":flash"], [
                ":best_connected_ever", ":flash_loop", [":delayed", 2000, [":sockjs_loop"]]
              ], [
                ":sockjs_loop"
              ]
            ]]
          ]
        ]
      ]
    ];
  };
}).call(this);
