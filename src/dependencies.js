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

  window.WEB_SOCKET_SWF_LOCATION = root + "/WebSocketMain.swf";

  var deps = [],
      callback = function () {
        Pusher.ready()
      }
  // Check for JSON dependency
  if (window['JSON'] == undefined) {
    deps.push(root + '/json2<DEPENDENCY_SUFFIX>.js');
  }
  // Check for Flash fallback dep. Wrap initialization.
  if (window['WebSocket'] == undefined) {
    // Don't let WebSockets.js initialize on load. Inconsistent accross browsers.
    window.WEB_SOCKET_DISABLE_AUTO_INITIALIZATION = true;
    deps.push(root + '/flashfallback<DEPENDENCY_SUFFIX>.js');
    callback = function(){
      WebSocket.__addTask(function() {
        Pusher.ready();
      })

      if (window['WebSocket']) {
        // This will call the FABridge callback, which initializes pusher!
        WebSocket.__initialize();
      } else {
        // Flash is not installed
        Pusher.log("Pusher : Could not connect : WebSocket is not availabe natively or via Flash")
        // TODO: Update Pusher state in such a way that users can bind to it
      }
    }
  }
  
  if( deps.length > 0){
    _require(deps, callback);
  } else {
    callback();
  }
})();
