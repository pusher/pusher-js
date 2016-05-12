var getDefaultStrategy = function(config) {
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
      hostEncrypted: config.wsHost + ":" + config.wssPort,
      httpPath: config.wsPath
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
    [":def_transport", "xhr_polling", "xhr_polling", 1, ":http_options"],

    [":def", "ws_loop", [":sequential", ":timeouts", ":ws"]],
    [":def", "wss_loop", [":sequential", ":timeouts", ":wss"]],

    [":def", "streaming_loop", [":sequential", ":timeouts", ":xhr_streaming"]],
    [":def", "polling_loop", [":sequential", ":timeouts", ":xhr_polling"]],

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

export default getDefaultStrategy;
