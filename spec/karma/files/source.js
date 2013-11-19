module.exports = [
  'src/pusher.js',

  'src/utils/timer.js',
  'src/utils/periodic_timer.js',

  'src/util.js',
  'src/defaults.js',
  'src/config.js',
  'src/errors.js',
  'src/dependency_loader.js',
  'src/dependencies.js',
  'src/events_dispatcher.js',
  'src/net_info.js',

  'src/base64.js',
  'src/jsonp/jsonp_request.js',
  'src/jsonp/jsonp_receiver.js',

  'src/timeline/timeline.js',
  'src/timeline/timeline_sender.js',

  'src/strategies/best_connected_ever_strategy.js',
  'src/strategies/cached_strategy.js',
  'src/strategies/delayed_strategy.js',
  'src/strategies/first_connected_strategy.js',
  'src/strategies/if_strategy.js',
  'src/strategies/sequential_strategy.js',
  'src/strategies/transport_strategy.js',

  'src/transports/abstract_transport.js',
  'src/transports/flash_transport.js',
  'src/transports/sockjs_transport.js',
  'src/transports/ws_transport.js',

  'src/transports/assistant_to_the_transport_manager.js',
  'src/transports/transport_manager.js',

  'src/strategies/strategy_builder.js',

  'src/connection/protocol.js',
  'src/connection/connection.js',
  'src/connection/handshake.js',
  'src/connection/connection_manager.js',

  'src/channels/members.js',
  'src/channels/channel.js',
  'src/channels/private_channel.js',
  'src/channels/presence_channel.js',
  'src/channels/channels.js',

  'src/pusher_authorizer.js'
];
