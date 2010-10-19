WEB_SOCKET_SWF_LOCATION = "<PUSHER_REQUIRE_ROOT>/WebSocketMain.swf";

(function () {
  
  var root = '<PUSHER_REQUIRE_ROOT>',
      deps = [
        ['JSON', '/json2'],
        ['WebSocket', '/flashfallback']
      ],
      dep_count = 0,
      missing_deps = [];
  
  var index = 0;
  function checkReady () {
    if ( missing_deps.length == dep_count ) {
      // alert(Pusher.instances.length)
      // Pusher.ready()
      
      FABridge.addInitializationCallback('webSocket', function () {
        Pusher.ready()
      })
      WebSocket.__initialize()
    }
  }
  
  function require (src) {
    var head = document.getElementsByTagName('head')[0];
    var script = document.createElement('script');
    script.setAttribute('src', root + src + '.js');
    script.setAttribute("type","text/javascript");

    script.onload = function(){
      dep_count++;
      checkReady();
    }
    script.onreadystatechange = function () {
      if (this.readyState == 'loaded') {
        dep_count++;
        checkReady();
      }
    }
    head.appendChild(script);
  }
  
  for(var i = 0; i < deps.length; i++) {
    if ( window[deps[i][0]] == undefined){
      missing_deps.push(deps[i]);
    }
  }
  for(var i = 0; i < missing_deps.length; i++) {
    if ( window[missing_deps[i][0]] == undefined){
      require(missing_deps[i][1]);
    }
  }
  checkReady();

})();