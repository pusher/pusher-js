var Logger = require('./logger');
var Util = require('./util');

var Authorizer = function(channel, options) {
  this.channel = channel;
  this.type = options.authTransport;

  this.options = options;
  this.authOptions = (options || {}).auth || {};
};

Authorizer.prototype = {
  composeQuery: function(socketId) {
    var query = 'socket_id=' + encodeURIComponent(socketId) +
      '&channel_name=' + encodeURIComponent(this.channel.name);

    for(var i in this.authOptions.params) {
      query += "&" + encodeURIComponent(i) + "=" + encodeURIComponent(this.authOptions.params[i]);
    }

    return query;
  },

  authorize: function(socketId, callback) {
    return authorizers[this.type].call(this, socketId, callback);
  }
};

var nextAuthCallbackID = 1;

var authorizers = {
  ajax: function(socketId, callback){
    var self = this, xhr;

    if (Pusher.XHR) {
      xhr = new Pusher.XHR();
    } else {
      xhr = (window.XMLHttpRequest ? new window.XMLHttpRequest() : new ActiveXObject("Microsoft.XMLHTTP"));
    }

    xhr.open("POST", self.options.authEndpoint, true);

    // add request headers
    xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
    for(var headerName in this.authOptions.headers) {
      xhr.setRequestHeader(headerName, this.authOptions.headers[headerName]);
    }

    xhr.onreadystatechange = function() {
      if (xhr.readyState === 4) {
        if (xhr.status === 200) {
          var data, parsed = false;

          try {
            data = JSON.parse(xhr.responseText);
            parsed = true;
          } catch (e) {
            callback(true, 'JSON returned from webapp was invalid, yet status code was 200. Data was: ' + xhr.responseText);
          }

          if (parsed) { // prevents double execution.
            callback(false, data);
          }
        } else {
          Logger.warn("Couldn't get auth info from your webapp", xhr.status);
          callback(true, xhr.status);
        }
      }
    };

    xhr.send(this.composeQuery(socketId));
    return xhr;
  }
};

module.exports = Authorizer;
