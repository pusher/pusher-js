;(function() {

  var StrategyBuilder = {};

  StrategyBuilder.transports = {
    ws: Pusher.WSTransport,
    flash: Pusher.FlashTransport,
    sockjs: Pusher.SockJSTransport
  };

  StrategyBuilder.builders = {
    transport: function(scheme) {
      var klass = StrategyBuilder.transports[scheme.transport];
      if (!klass) {
        throw ("unsupported transport " + scheme.transport); // TODO
      }

      var options = filter(scheme, {"type": true, "transport": true});
      return new Pusher.TransportStrategy(klass, options);
    },

    delayed: function(scheme) {
      var options = filter(scheme, {"type": true, "child": true});

      return new Pusher.DelayedStrategy(
        StrategyBuilder.build(merge(options, scheme.child)),
        options
      );
    },

    sequential: function(scheme) {
      return buildWithSubstrategies(Pusher.SequentialStrategy, scheme);
    },

    first_supported: function(scheme) {
      return buildWithSubstrategies(Pusher.FirstSupportedStrategy, scheme);
    },

    first_connected: function(scheme) {
      return buildWithSubstrategies(Pusher.FirstConnectedStrategy, scheme);
    },

    first_connected_ever: function(scheme) {
      return buildWithSubstrategies(Pusher.FirstConnectedEverStrategy, scheme);
    }
  };

  StrategyBuilder.build = function(scheme) {
    var builder = this.builders[scheme.type];

    if (!builder) {
      throw ("unsupported strategy type " + scheme.type); // TODO
    }

    return builder(scheme);
  };

  // helpers

  function buildWithSubstrategies(constructor, scheme) {
    var options = filter(scheme, {"type": true, "children": true});
    var substrategies = [];

    for (var i = 0; i < scheme.children.length; i++) {
      substrategies.push(
        StrategyBuilder.build(merge(options, scheme.children[i]))
      );
    }

    return new constructor(substrategies, options);
  };

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
  };

  function merge(a, b) {
    var result = {};
    for (var key in a) {
      if (Object.prototype.hasOwnProperty.call(a, key)) {
        result[key] = a[key];
      }
    }
    for (var key in b) {
      if (Object.prototype.hasOwnProperty.call(b, key)) {
        result[key] = b[key];
      }
    }

    return result;
  };

  Pusher.StrategyBuilder = StrategyBuilder;

}).call(this);
