var getDefaultStrategy = function(config : any) : any {
  var wsStrategy;
  if (config.encrypted) {
    wsStrategy = [
      ":best_connected_ever",
      ":ws_loop",
      [":delayed", 2000, [":http_fallback_loop"]]
    ];
  } else {
    wsStrategy = [
      ":best_connected_ever",
      ":ws_loop",
      [":delayed", 2000, [":wss_loop"]],
      [":delayed", 5000, [":http_fallback_loop"]]
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
    [":def", "sockjs_options", {
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
    [":def_transport", "sockjs", "sockjs", 1, ":sockjs_options"],
    [":def_transport", "xhr_streaming", "xhr_streaming", 1, ":sockjs_options", ":streaming_manager"],
    [":def_transport", "xdr_streaming", "xdr_streaming", 1, ":sockjs_options", ":streaming_manager"],
    [":def_transport", "xhr_polling", "xhr_polling", 1, ":sockjs_options"],
    [":def_transport", "xdr_polling", "xdr_polling", 1, ":sockjs_options"],

    [":def", "ws_loop", [":sequential", ":timeouts", ":ws"]],
    [":def", "wss_loop", [":sequential", ":timeouts", ":wss"]],
    [":def", "sockjs_loop", [":sequential", ":timeouts", ":sockjs"]],

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

    [":def", "http_fallback_loop",
      [":if", [":is_supported", ":http_loop"], [
        ":http_loop"
      ], [
        ":sockjs_loop"
      ]]
    ],

    [":def", "strategy",
      [":cached", 1800000,
        [":first_connected",
          [":if", [":is_supported", ":ws"],
            wsStrategy,
            ":http_fallback_loop"
          ]
        ]
      ]
    ]
  ];
};

export default getDefaultStrategy;
