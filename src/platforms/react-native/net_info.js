// var NetInfo = require('react-native').NetInfo;
// Do things with: https://facebook.github.io/react-native/docs/netinfo.html
var EventsDispatcher = require('../../events_dispatcher');
var Util = require('../../util');

function NetInfo(){
  EventsDispatcher.call(this);
}

Util.extend(NetInfo.prototype, EventsDispatcher.prototype);

var prototype = NetInfo.prototype;

prototype.isOnline = function(){
  return true;
}

exports.NetInfo = NetInfo;
exports.Network = new NetInfo();