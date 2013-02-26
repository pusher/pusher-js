;(function() {
  var StrategyBuilder = {
    /** Transforms a JSON scheme to a strategy tree.
     *
     * @param {Array} scheme JSON strategy scheme
     * @returns {Strategy} strategy tree that's represented by the scheme
     */
    build: function(scheme, options) {
      var context = Pusher.Util.extend({}, globalContext, options);
      return evaluate(scheme, context)[1].strategy;
    }
  };

  var transports = {
    ws: Pusher.WSTransport,
    flash: Pusher.FlashTransport,
    sockjs: Pusher.SockJSTransport
  };

  // DSL bindings

  function returnWithOriginalContext(f) {
    return function(context) {
      return [f.apply(this, arguments), context];
    };
  }

  var globalContext = {
    def: function(context, name, value) {
      if (context[name] !== undefined) {
        throw "Redefining symbol " + name;
      }
      context[name] = value;
      return [undefined, context];
    },

    def_transport: function(context, name, type, priority, options) {
      var transportClass = transports[type];
      if (!transportClass) {
        throw new Pusher.Errors.UnsupportedTransport(type);
      }
      var transportOptions = Pusher.Util.extend({}, {
        key: context.key,
        encrypted: context.encrypted,
        timeline: context.timeline,
        disableFlash: context.disableFlash
      }, options)
      var transport = new Pusher.TransportStrategy(
        name, priority, transportClass, transportOptions
      );
      var newContext = context.def(context, name, transport)[1];
      newContext.transports = context.transports || {};
      newContext.transports[name] = transport;
      return [undefined, newContext];
    },

    sequential: returnWithOriginalContext(function(context, options) {
      var strategies = Array.prototype.slice.call(arguments, 2);
      return new Pusher.SequentialStrategy(strategies, options);
    }),

    last_successful: returnWithOriginalContext(function(context, ttl, strategy) {
      return new Pusher.LastSuccessfulStrategy(strategy, {
        key: context.key,
        ttl: ttl,
        timeline: context.timeline
      });
    }),

    first_connected: returnWithOriginalContext(function(context, strategy) {
      return new Pusher.FirstConnectedStrategy(strategy);
    }),

    best_connected_ever: returnWithOriginalContext(function(context) {
      var strategies = Array.prototype.slice.call(arguments, 1);
      return new Pusher.BestConnectedEverStrategy(strategies);
    }),

    delayed: returnWithOriginalContext(function(context, delay, strategy) {
      return new Pusher.DelayedStrategy(strategy, { delay: delay });
    }),

    "if": returnWithOriginalContext(function(context, condition, trueBranch, falseBranch) {
      return new Pusher.IfStrategy(condition, trueBranch, falseBranch);
    }),

    is_supported: returnWithOriginalContext(function(context, strategy) {
      return function() {
        return strategy.isSupported();
      };
    }),
  };

  // DSL interpreter

  function isSymbol(expression) {
    return expression.length > 1 && expression[0] === ":";
  }

  function getSymbolValue(expression, context) {
    return context[expression.slice(1)];
  }

  function evaluateListOfExpressions(expressions, context) {
    if (expressions.length === 0) {
      return [[], context];
    }
    var head = evaluate(expressions[0], context);
    var tail = evaluateListOfExpressions(expressions.slice(1), head[1])
    return [[head[0]].concat(tail[0]), tail[1]];
  }

  function evaluate(expression, context) {
    var expressionType = typeof expression;
    if (typeof expression === "string") {
      if (!isSymbol(expression)) {
        return [expression, context];
      }
      var value = getSymbolValue(expression, context);
      if (value !== undefined) {
        return [value, context];
      } else {
        throw "Undefined symbol " + expression;
      }
    } else if (typeof expression === "object") {
      if (expression instanceof Array && expression.length > 0) {
        if (isSymbol(expression[0])) {
          var f = getSymbolValue(expression[0], context);

          if (expression.length > 1) {
            if (typeof f !== "function") {
              throw "Calling non-function " + expression[0];
            }
            var args = [Pusher.Util.extend({}, context)].concat(
              expression.slice(1).map(function(arg) {
                return evaluate(arg, Pusher.Util.extend({}, context))[0];
              })
            );
            return f.apply(this, args);
          } else {
            return [f, context];
          }
        } else {
          return evaluateListOfExpressions(expression, context);
        }
      } else {
        return [expression, context];
      }
    } else {
      return [expression, context];
    }
  }

  Pusher.StrategyBuilder = StrategyBuilder;
}).call(this);
