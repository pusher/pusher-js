;(function() {
  Pusher.VERSION = '<VERSION>';
  Pusher.PROTOCOL = 7;

  // DEPRECATED: WS connection parameters
  Pusher.host = 'ws.pusherapp.com';
  Pusher.ws_port = 80;
  Pusher.wss_port = 443;
  // DEPRECATED: SockJS fallback parameters
  Pusher.sockjs_host = 'sockjs.pusher.com';
  Pusher.sockjs_http_port = 80;
  Pusher.sockjs_https_port = 443;
  Pusher.sockjs_path = "/pusher";
  // DEPRECATED: Stats
  Pusher.stats_host = 'stats.pusher.com';
  // DEPRECATED: Other settings
  Pusher.channel_auth_endpoint = '/pusher/auth';
  Pusher.channel_auth_transport = 'ajax';
  Pusher.activity_timeout = 120000;
  Pusher.pong_timeout = 30000;
  Pusher.unavailable_timeout = 10000;
  // CDN configuration
  Pusher.cdn_http = '<CDN_HTTP>';
  Pusher.cdn_https = '<CDN_HTTPS>';
  Pusher.dependency_suffix = '<DEPENDENCY_SUFFIX>';

  Pusher.getDefaultStrategy = function(config) {
    return [
      [":def", "ws_options", {
        hostUnencrypted: config.wsHost + ":" + config.wsPort,
        hostEncrypted: config.wsHost + ":" + config.wssPort
      }],
      [":def", "sockjs_options", {
        hostUnencrypted: config.httpHost + ":" + config.httpPort,
        hostEncrypted: config.httpHost + ":" + config.httpsPort
      }],
      [":def", "timeouts", {
        loop: true,
        timeout: 15000,
        timeoutLimit: 60000
      }],

      [":def", "ws_manager", [":transport_manager", {
        lives: 2,
        minPingDelay: 10000,
        maxPingDelay: config.activity_timeout
      }]],

      [":def_transport", "ws", "ws", 3, ":ws_options", ":ws_manager"],
      [":def_transport", "flash", "flash", 2, ":ws_options", ":ws_manager"],
      [":def_transport", "sockjs", "sockjs", 1, ":sockjs_options"],
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
