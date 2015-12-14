exports.VERSION = '<VERSION>';
exports.PROTOCOL = 7;

// DEPRECATED: WS connection parameters
exports.host = 'ws.pusherapp.com';
exports.ws_port = 80;
exports.wss_port = 443;
// DEPRECATED: SockJS fallback parameters
exports.sockjs_host = 'sockjs.pusher.com';
exports.sockjs_http_port = 80;
exports.sockjs_https_port = 443;
exports.sockjs_path = "/pusher";
// DEPRECATED: Stats
exports.stats_host = 'stats.pusher.com';
// DEPRECATED: Other settings
exports.channel_auth_endpoint = '/pusher/auth';
exports.channel_auth_transport = 'ajax';
exports.activity_timeout = 120000;
exports.pong_timeout = 30000;
exports.unavailable_timeout = 10000;

exports.getDefaultStrategy = function(config) {
  var wsStrategy;
  if (config.encrypted) {
    wsStrategy = [
      ":best_connected_ever",
      ":ws_loop",
      [":delayed", 2000, [":http_loop"]]
    ];
  } else {
    wsStrategy = [
      ":best_connected_ever",
      ":ws_loop",
      [":delayed", 2000, [":wss_loop"]],
      [":delayed", 5000, [":http_loop"]]
    ];
  }

  return [
    [":def", "ws_options", {
      hostUnencrypted: config.wsHost + ":" + config.wsPort,
      hostEncrypted: config.wsHost + ":" + config.wssPort
    }],
    [":def", "wss_options", [":extend", ":ws_options", {
      encrypted: true
    }]],
    [":def", "http_options", {
      hostUnencrypted: config.httpHost + ":" + config.httpPort,
      hostEncrypted: config.httpHost + ":" + config.httpsPort,
      httpPath: config.httpPath
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
    [":def", "streaming_manager", [":transport_manager", {
      lives: 2,
      minPingDelay: 10000,
      maxPingDelay: config.activity_timeout
    }]],

    [":def_transport", "ws", "ws", 3, ":ws_options", ":ws_manager"],
    [":def_transport", "wss", "ws", 3, ":wss_options", ":ws_manager"],
    [":def_transport", "xhr_streaming", "xhr_streaming", 1, ":http_options", ":streaming_manager"],
    [":def_transport", "xdr_streaming", "xdr_streaming", 1, ":http_options", ":streaming_manager"],
    [":def_transport", "xhr_polling", "xhr_polling", 1, ":http_options"],
    [":def_transport", "xdr_polling", "xdr_polling", 1, ":http_options"],

    [":def", "ws_loop", [":sequential", ":timeouts", ":ws"]],
    [":def", "wss_loop", [":sequential", ":timeouts", ":wss"]],

    [":def", "streaming_loop", [":sequential", ":timeouts",
      [":if", [":is_supported", ":xhr_streaming"],
        ":xhr_streaming",
        ":xdr_streaming"
      ]
    ]],
    [":def", "polling_loop", [":sequential", ":timeouts",
      [":if", [":is_supported", ":xhr_polling"],
        ":xhr_polling",
        ":xdr_polling"
      ]
    ]],

    [":def", "http_loop", [":if", [":is_supported", ":streaming_loop"], [
      ":best_connected_ever",
        ":streaming_loop",
        [":delayed", 4000, [":polling_loop"]]
    ], [
      ":polling_loop"
    ]]],

    [":def", "strategy",
      [":cached", 1800000,
        [":first_connected",
          [":if", [":is_supported", ":ws"],
            wsStrategy,
            ":http_loop"
          ]
        ]
      ]
    ]
  ];
};
