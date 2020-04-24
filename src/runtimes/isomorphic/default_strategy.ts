import * as Collections from 'core/utils/collections';
import TransportManager from 'core/transports/transport_manager';
import Strategy from 'core/strategies/strategy';
import SequentialStrategy from 'core/strategies/sequential_strategy';
import BestConnectedEverStrategy from 'core/strategies/best_connected_ever_strategy';
import CachedStrategy, {
  TransportStrategyDictionary
} from 'core/strategies/cached_strategy';
import DelayedStrategy from 'core/strategies/delayed_strategy';
import IfStrategy from 'core/strategies/if_strategy';
import FirstConnectedStrategy from 'core/strategies/first_connected_strategy';
import { Config } from 'core/config';
import StrategyOptions from 'core/strategies/strategy_options';

function testSupportsStrategy(strategy: Strategy) {
  return function() {
    return strategy.isSupported();
  };
}

var getDefaultStrategy = function(
  config: Config,
  baseOptions: StrategyOptions,
  defineTransport: Function
): Strategy {
  var definedTransports = <TransportStrategyDictionary>{};

  function defineTransportStrategy(
    name: string,
    type: string,
    priority: number,
    options: StrategyOptions,
    manager?: TransportManager
  ) {
    var transport = defineTransport(
      config,
      name,
      type,
      priority,
      options,
      manager
    );

    definedTransports[name] = transport;

    return transport;
  }

  var ws_options: StrategyOptions = Object.assign({}, baseOptions, {
    hostNonTLS: config.wsHost + ':' + config.wsPort,
    hostTLS: config.wsHost + ':' + config.wssPort,
    httpPath: config.wsPath
  });
  var wss_options: StrategyOptions = Collections.extend({}, ws_options, {
    useTLS: true
  });
  var http_options: StrategyOptions = Object.assign({}, baseOptions, {
    hostNonTLS: config.httpHost + ':' + config.httpPort,
    hostTLS: config.httpHost + ':' + config.httpsPort,
    httpPath: config.httpPath
  });
  var timeouts = {
    loop: true,
    timeout: 15000,
    timeoutLimit: 60000
  };

  var ws_manager = new TransportManager({
    lives: 2,
    minPingDelay: 10000,
    maxPingDelay: config.activityTimeout
  });
  var streaming_manager = new TransportManager({
    lives: 2,
    minPingDelay: 10000,
    maxPingDelay: config.activityTimeout
  });

  var ws_transport = defineTransportStrategy(
    'ws',
    'ws',
    3,
    ws_options,
    ws_manager
  );
  var wss_transport = defineTransportStrategy(
    'wss',
    'ws',
    3,
    wss_options,
    ws_manager
  );
  var xhr_streaming_transport = defineTransportStrategy(
    'xhr_streaming',
    'xhr_streaming',
    1,
    http_options,
    streaming_manager
  );
  var xhr_polling_transport = defineTransportStrategy(
    'xhr_polling',
    'xhr_polling',
    1,
    http_options
  );

  var ws_loop = new SequentialStrategy([ws_transport], timeouts);
  var wss_loop = new SequentialStrategy([wss_transport], timeouts);
  var streaming_loop = new SequentialStrategy(
    [xhr_streaming_transport],
    timeouts
  );
  var polling_loop = new SequentialStrategy([xhr_polling_transport], timeouts);

  var http_loop = new SequentialStrategy(
    [
      new IfStrategy(
        testSupportsStrategy(streaming_loop),
        new BestConnectedEverStrategy([
          streaming_loop,
          new DelayedStrategy(polling_loop, { delay: 4000 })
        ]),
        polling_loop
      )
    ],
    timeouts
  );

  var wsStrategy;
  if (baseOptions.useTLS) {
    wsStrategy = new BestConnectedEverStrategy([
      ws_loop,
      new DelayedStrategy(http_loop, { delay: 2000 })
    ]);
  } else {
    wsStrategy = new BestConnectedEverStrategy([
      ws_loop,
      new DelayedStrategy(wss_loop, { delay: 2000 }),
      new DelayedStrategy(http_loop, { delay: 5000 })
    ]);
  }

  return new CachedStrategy(
    new FirstConnectedStrategy(
      new IfStrategy(testSupportsStrategy(ws_transport), wsStrategy, http_loop)
    ),
    definedTransports,
    {
      ttl: 1800000,
      timeline: baseOptions.timeline,
      useTLS: baseOptions.useTLS
    }
  );
};

export default getDefaultStrategy;
