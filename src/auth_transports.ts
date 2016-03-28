import Logger from './logger';
import AbstractRuntime from './runtimes/abstract_runtime';
import Browser from './runtimes/browser';
import Factory from './utils/factory';

interface AuthTransport {
  (context : AbstractRuntime, socketId : string, callback : Function) : void
}

interface AuthTransports {
  [index : string] : AuthTransport;
}

var ajax : AuthTransport = function(context : AbstractRuntime, socketId, callback){
  var self = this, xhr;

  xhr = Factory.createXHR();
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

var jsonp : AuthTransport = function(context : Browser, socketId, callback){
  if(this.authOptions.headers !== undefined) {
    Logger.warn("Warn", "To send headers with the auth request, you must use AJAX, rather than JSONP.");
  }

  var callbackName = context.nextAuthCallbackID.toString();
  context.nextAuthCallbackID++;

  var document = context.getDocument();
  var script = document.createElement("script");
  // Hacked wrapper.
  context.auth_callbacks[callbackName] = function(data) {
    callback(false, data);
  };

  var callback_name = "Pusher.Runtime.auth_callbacks['" + callbackName + "']";
  script.src = this.options.authEndpoint +
    '?callback=' +
    encodeURIComponent(callback_name) +
    '&' +
    this.composeQuery(socketId);

  var head = document.getElementsByTagName("head")[0] || document.documentElement;
  head.insertBefore( script, head.firstChild );
};


export {AuthTransport, AuthTransports, ajax, jsonp};
