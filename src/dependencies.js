WEB_SOCKET_SWF_LOCATION = "<PUSHER_REQUIRE_ROOT>/WebSocketMain.swf";

(function () {
  
  var root = '<PUSHER_REQUIRE_ROOT>',
      deps = [
        ['JSON', '/json2'],
        ['WebSocket', '/flashfallback']
      ];
  
  var index = 0;
  
  function require (src) {
    var head = document.getElementsByTagName('head')[0];
    var script = document.createElement('script');
    script.setAttribute('src', root + src + '.js');
    script.setAttribute("type","text/javascript");
    head.appendChild(script);
  }
  
  for(var i = 0; i < deps.length; i++) {
    if ( window[deps[i][0]] == undefined){
      require(deps[i][1]);
    }
  }

})();