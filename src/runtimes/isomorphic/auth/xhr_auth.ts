import Logger from 'core/logger';
import TimelineSender from 'core/timeline/timeline_sender'
import * as Collections from 'core/utils/collections';
import Util from 'core/util';
import Runtime from 'runtime';
import {AuthTransport} from 'core/auth/auth_transports';
import AbstractRuntime from 'runtimes/interface';
import Authorizer from 'core/auth/pusher_authorizer';

var ajax : AuthTransport = function(this: Authorizer, context : AbstractRuntime, socketId : string, callback : Function){
  let xhr;

  xhr = Runtime.createXHR();
  xhr.withCredentials = this.authOptions.withCredentials;

  xhr.open("POST", this.options.authEndpoint, true);

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

export default ajax;
