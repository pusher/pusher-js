;(function() {
  var StrategyBuilder = {
    /** Transforms a JSON scheme to a strategy tree.
     *
     * @param {Object} scheme JSON strategy scheme
     * @returns {Strategy} strategy tree that's represented by the scheme
     */
    build: function(scheme) {
      var builder = builders[scheme.type];

      if (!builder) {
        throw new Pusher.Errors.UnsupportedStrategy(scheme.type);
      }

      return builder(scheme);
    }
  };

  var transports = {
    ws: Pusher.WSTransport,
    flash: Pusher.FlashTransport,
    sockjs: Pusher.SockJSTransport
  };

  var builders = {
    transport: function(scheme) {
      var klass = transports[scheme.transport];
      if (!klass) {
        throw new Pusher.Errors.UnsupportedTransport(scheme.transport);
      }

      var options = filter(scheme, {"type": true, "transport": true});
      return new Pusher.TransportStrategy(klass, options);
    },

    delayed: function(scheme) {
      var options = filter(scheme, {"type": true, "child": true});

      return new Pusher.DelayedStrategy(
        StrategyBuilder.build(Pusher.Util.extend({}, options, scheme.child)),
        options
      );
    },

    sequential: function(scheme) {
      return buildWithSubstrategies(Pusher.SequentialStrategy, scheme);
    },

    first_supported: function(scheme) {
      return buildWithSubstrategies(Pusher.FirstSupportedStrategy, scheme);
    },

    all_supported: function(scheme) {
      return buildWithSubstrategies(Pusher.AllSupportedStrategy, scheme);
    },

    first_connected: function(scheme) {
      return buildWithSubstrategies(Pusher.FirstConnectedStrategy, scheme);
    },

    best_connected_ever: function(scheme) {
      return buildWithSubstrategies(Pusher.BestConnectedEverStrategy, scheme);
    }
  };

  function buildWithSubstrategies(constructor, scheme) {
    var options = filter(scheme, {"type": true, "children": true});
    var substrategies = [];

    for (var i = 0; i < scheme.children.length; i++) {
      substrategies.push(
        StrategyBuilder.build(
          Pusher.Util.extend({}, options, scheme.children[i])
        )
      );
    }

    return new constructor(substrategies, options);
  }

  function filter(object, filteredKeys) {
    var result = {};
    for (var key in object) {
      if (Object.prototype.hasOwnProperty.call(object, key)) {
        if (!filteredKeys[key]) {
          result[key] = object[key];
        }
      }
    }

    return result;
  }

  Pusher.StrategyBuilder = StrategyBuilder;
}).call(this);
