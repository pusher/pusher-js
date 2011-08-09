var _require = (function () {

  var handleScriptLoaded;
  if (document.addEventListener) {
    handleScriptLoaded = function (elem, callback) {
      elem.addEventListener('load', callback, false)
    }
  } else {
    handleScriptLoaded = function(elem, callback) {
      elem.attachEvent('onreadystatechange', function () {
        if(elem.readyState == 'loaded' || elem.readyState == 'complete') callback()
      })
    }
  }

  return function (deps, callback) {
    var dep_count = 0,
    dep_length = deps.length;

    function checkReady (callback) {
      dep_count++;
      if ( dep_length == dep_count ) {
        // Opera needs the timeout for page initialization weirdness
        setTimeout(callback, 0);
      }
    }

    function addScript (src, callback) {
      callback = callback || function(){}
      var head = document.getElementsByTagName('head')[0];
      var script = document.createElement('script');
      script.setAttribute('src', src);
      script.setAttribute("type","text/javascript");
      script.setAttribute('async', true);

      handleScriptLoaded(script, function () {
        checkReady(callback);
      });

      head.appendChild(script);
    }

    for(var i = 0; i < dep_length; i++) {
      addScript(deps[i], callback);
    }
  }
})();

;(function() {
  var cdn = (document.location.protocol == 'http:') ? Pusher.cdn_http : Pusher.cdn_https;
  var root = cdn + Pusher.VERSION;

  var deps = [];
  if (typeof window['JSON'] === undefined) {
    deps.push(root + '/json2<DEPENDENCY_SUFFIX>.js');
  }
  if (typeof window['WebSocket'] === 'undefined') {
    // We manually initialize web-socket-js to iron out cross browser issues
    window.WEB_SOCKET_DISABLE_AUTO_INITIALIZATION = true;
    deps.push(root + '/flashfallback<DEPENDENCY_SUFFIX>.js');
  }

  var initialize = function() {
    Pusher.NetInfo = Pusher.Connection.NetInfo;

    if (typeof window['WebSocket'] === 'undefined' && typeof window['MozWebSocket'] === 'undefined') {
      return function() {
        // This runs after flashfallback.js has loaded
        if (typeof window['WebSocket'] !== 'undefined') {
          // window['WebSocket'] is a flash emulation of WebSocket
          Pusher.Transport = window['WebSocket'];
          Pusher.TransportType = 'flash';

          window.WEB_SOCKET_SWF_LOCATION = root + "/WebSocketMain.swf";
          WebSocket.__addTask(function() {
            Pusher.ready();
          })
          WebSocket.__initialize();
        } else {
          // Flash must not be installed
          Pusher.Transport = null;
          Pusher.TransportType = 'none';
          Pusher.ready();
        }
      }
    } else {
      return function() {
        // This is because Mozilla have decided to
        // prefix the WebSocket constructor with "Moz".
        if (typeof window['MozWebSocket'] !== 'undefined') {
          Pusher.Transport = window['MozWebSocket'];
        } else {
          Pusher.Transport = window['WebSocket'];
        }
        // We have some form of a native websocket,
        // even if the constructor is prefixed:
        Pusher.TransportType = 'native';

        // Initialise Pusher.
        Pusher.ready();
      }
    }
  }();

  var ondocumentbody = function(callback) {
    var load_body = function() {
      document.body ? callback() : setTimeout(load_body, 0);
    }
    load_body();
  };

  var initializeOnDocumentBody = function() {
    ondocumentbody(initialize);
  }

  if (deps.length > 0) {
    _require(deps, initializeOnDocumentBody);
  } else {
    initializeOnDocumentBody();
  }
})();
