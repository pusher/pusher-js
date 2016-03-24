var Util = require('../util');
var Transports = require('../transports/transports');
var TransportManager = require('../transports/transport_manager');
var Errors = require('../errors');
var TransportStrategy = require('./transport_strategy');
var SequentialStrategy = require('./sequential_strategy');
var BestConnectedEverStrategy = require('./best_connected_ever_strategy');
var CachedStrategy = require('./cached_strategy');
var DelayedStrategy = require('./delayed_strategy');
var IfStrategy = require('./if_strategy');
var FirstConnectedStrategy = require('./first_connected_strategy');

module.exports = {
  /** Transforms a JSON scheme to a strategy tree.
   *
   * @param {Array} scheme JSON strategy scheme
   * @param {Object} options a hash of symbols to be included in the scheme
   * @returns {Strategy} strategy tree that's represented by the scheme
   */
  build: function(scheme, options) {
    var context = Util.extend({}, globalContext, options);
    return evaluate(scheme, context)[1].strategy;
  }
};

var transports = {
  ws: Transports.WSTransport,
  xhr_streaming: Transports.XHRStreamingTransport,
  xdr_streaming: Transports.XDRStreamingTransport,
  xhr_polling: Transports.XHRPollingTransport,
  xdr_polling: Transports.XDRPollingTransport
};

var UnsupportedStrategy = {
  isSupported: function() {
    return false;
  },
  connect: function(_, callback) {
    var deferred = Util.defer(function() {
      callback(new Errors.UnsupportedStrategy());
    });
    return {
      abort: function() {
        deferred.ensureAborted();
      },
      forceMinPriority: function() {}
    };
  }
};

// DSL bindings

function returnWithOriginalContext(f) {
  return function(context) {
    return [f.apply(this, arguments), context];
  };
}

var globalContext = {
  extend: function(context, first, second) {
    return [Util.extend({}, first, second), context];
  },

  def: function(context, name, value) {
    if (context[name] !== undefined) {
      throw "Redefining symbol " + name;
    }
    context[name] = value;
    return [undefined, context];
  },

  def_transport: function(context, name, type, priority, options, manager) {
    var transportClass = transports[type];
    if (!transportClass) {
      throw new Errors.UnsupportedTransport(type);
    }

    var enabled =
      (!context.enabledTransports ||
        Util.arrayIndexOf(context.enabledTransports, name) !== -1) &&
      (!context.disabledTransports ||
        Util.arrayIndexOf(context.disabledTransports, name) === -1);

    var transport;
    if (enabled) {
      transport = new TransportStrategy(
        name,
        priority,
        manager ? manager.getAssistant(transportClass) : transportClass,
        Util.extend({
          key: context.key,
          encrypted: context.encrypted,
          timeline: context.timeline,
          ignoreNullOrigin: context.ignoreNullOrigin
        }, options)
      );
    } else {
      transport = UnsupportedStrategy;
    }

    var newContext = context.def(context, name, transport)[1];
    newContext.transports = context.transports || {};
    newContext.transports[name] = transport;
    return [undefined, newContext];
  },

  transport_manager: returnWithOriginalContext(function(_, options) {
    return new TransportManager(options);
  }),

  sequential: returnWithOriginalContext(function(_, options) {
    var strategies = Array.prototype.slice.call(arguments, 2);
    return new SequentialStrategy(strategies, options);
  }),

  cached: returnWithOriginalContext(function(context, ttl, strategy){
    return new CachedStrategy(strategy, context.transports, {
      ttl: ttl,
      timeline: context.timeline,
      encrypted: context.encrypted
    });
  }),

  first_connected: returnWithOriginalContext(function(_, strategy) {
    return new FirstConnectedStrategy(strategy);
  }),

  best_connected_ever: returnWithOriginalContext(function() {
    var strategies = Array.prototype.slice.call(arguments, 1);
    return new BestConnectedEverStrategy(strategies);
  }),

  delayed: returnWithOriginalContext(function(_, delay, strategy) {
    return new DelayedStrategy(strategy, { delay: delay });
  }),

  "if": returnWithOriginalContext(function(_, test, trueBranch, falseBranch) {
    return new IfStrategy(test, trueBranch, falseBranch);
  }),

  is_supported: returnWithOriginalContext(function(_, strategy) {
    return function() {
      return strategy.isSupported();
    };
  })
};

// DSL interpreter

function isSymbol(expression) {
  return (typeof expression === "string") && expression.charAt(0) === ":";
}

function getSymbolValue(expression, context) {
  return context[expression.slice(1)];
}

function evaluateListOfExpressions(expressions, context) {
  if (expressions.length === 0) {
    return [[], context];
  }
  var head = evaluate(expressions[0], context);
  var tail = evaluateListOfExpressions(expressions.slice(1), head[1]);
  return [[head[0]].concat(tail[0]), tail[1]];
}

function evaluateString(expression, context) {
  if (!isSymbol(expression)) {
    return [expression, context];
  }
  var value = getSymbolValue(expression, context);
  if (value === undefined) {
    throw "Undefined symbol " + expression;
  }
  return [value, context];
}

function evaluateArray(expression, context) {
  if (isSymbol(expression[0])) {
    var f = getSymbolValue(expression[0], context);
    if (expression.length > 1) {
      if (typeof f !== "function") {
        throw "Calling non-function " + expression[0];
      }
      var args = [Util.extend({}, context)].concat(
        Util.map(expression.slice(1), function(arg) {
          return evaluate(arg, Util.extend({}, context))[0];
        })
      );
      return f.apply(this, args);
    } else {
      return [f, context];
    }
  } else {
    return evaluateListOfExpressions(expression, context);
  }
}

function evaluate(expression, context) {
  var expressionType = typeof expression;
  if (typeof expression === "string") {
    return evaluateString(expression, context);
  } else if (typeof expression === "object") {
    if (expression instanceof Array && expression.length > 0) {
      return evaluateArray(expression, context);
    }
  }
  return [expression, context];
}
