import * as Collections from "core/utils/collections";
import TransportManager from 'core/transports/transport_manager';
import Strategy from 'core/strategies/strategy';
import SequentialStrategy from 'core/strategies/sequential_strategy';
import BestConnectedEverStrategy from 'core/strategies/best_connected_ever_strategy';
import CachedStrategy, {TransportStrategyDictionary} from 'core/strategies/cached_strategy';
import DelayedStrategy from 'core/strategies/delayed_strategy';
import IfStrategy from 'core/strategies/if_strategy';
import FirstConnectedStrategy from 'core/strategies/first_connected_strategy';

function testSupportsStrategy(strategy: Strategy) {
  return function () {
    return strategy.isSupported();
  }
}

var getDefaultStrategy = function(config : any, defineTransport: Function) : Strategy {
  var definedTransports = <TransportStrategyDictionary>{};

  function defineTransportStrategy(name : string, type : string, priority : number, options, manager? : TransportManager) {
    var transport = defineTransport(config, name, type, priority, options, manager);

    definedTransports[name] = transport;

    return transport
  }

  var ws_options = {
    hostNonTLS: config.wsHost + ":" + config.wsPort,
    hostTLS: config.wsHost + ":" + config.wssPort,
    httpPath: config.wsPath
  };
  var wss_options = Collections.extend({}, ws_options, {
    useTLS: true
  });
  var sockjs_options = {
    hostNonTLS: config.httpHost + ":" + config.httpPort,
    hostTLS: config.httpHost + ":" + config.httpsPort,
    httpPath: config.httpPath
  };
  var timeouts = {
    loop: true,
    timeout: 15000,
    timeoutLimit: 60000
  };

  var ws_manager = new TransportManager({
    lives: 2,
    minPingDelay: 10000,
    maxPingDelay: config.activity_timeout
  });
  var streaming_manager = new TransportManager({
    lives: 2,
    minPingDelay: 10000,
    maxPingDelay: config.activity_timeout
  });

  var ws_transport = defineTransportStrategy("ws", "ws", 3, ws_options, ws_manager);
  var wss_transport = defineTransportStrategy("wss", "ws", 3, wss_options, ws_manager);
  var sockjs_transport = defineTransportStrategy("sockjs", "sockjs", 1, sockjs_options);
  var xhr_streaming_transport = defineTransportStrategy("xhr_streaming", "xhr_streaming", 1, sockjs_options, streaming_manager);
  var xdr_streaming_transport = defineTransportStrategy("xdr_streaming", "xdr_streaming", 1, sockjs_options, streaming_manager);
  var xhr_polling_transport = defineTransportStrategy("xhr_polling", "xhr_polling", 1, sockjs_options);
  var xdr_polling_transport = defineTransportStrategy("xdr_polling", "xdr_polling", 1, sockjs_options);

  var ws_loop = new SequentialStrategy([ws_transport], timeouts);
  var wss_loop = new SequentialStrategy([wss_transport], timeouts);
  var sockjs_loop = new SequentialStrategy([sockjs_transport], timeouts);
  var streaming_loop = new SequentialStrategy([new IfStrategy(testSupportsStrategy(xhr_streaming_transport), xhr_streaming_transport, xdr_streaming_transport)], timeouts);
  var polling_loop = new SequentialStrategy([new IfStrategy(testSupportsStrategy(xhr_polling_transport), xhr_polling_transport, xdr_polling_transport)], timeouts);

  var http_loop = new SequentialStrategy([new IfStrategy(
      testSupportsStrategy(streaming_loop),
      new BestConnectedEverStrategy([streaming_loop, new DelayedStrategy(polling_loop, { delay: 4000 })]),
      polling_loop
  )], timeouts);

  var http_fallback_loop = new IfStrategy(testSupportsStrategy(http_loop), http_loop, sockjs_loop);

  var wsStrategy;
  if (config.useTLS) {
    wsStrategy = new BestConnectedEverStrategy([ws_loop, new DelayedStrategy(http_fallback_loop, { delay: 2000 })])
  } else {
    wsStrategy = new BestConnectedEverStrategy([
      ws_loop,
      new DelayedStrategy(wss_loop, { delay: 2000 }),
      new DelayedStrategy(http_fallback_loop, { delay: 5000 })
    ])
  }

  return new CachedStrategy(new FirstConnectedStrategy(new IfStrategy(testSupportsStrategy(ws_transport), wsStrategy, http_fallback_loop)), definedTransports, {
    ttl: 1800000,
    timeline: config.timeline,
    useTLS: config.useTLS
  });
};

export default getDefaultStrategy;
