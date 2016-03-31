import Logger from 'core/logger';
import TimelineSender from 'core/timeline/timeline_sender'
import * as Collections from 'core/utils/collections';
import Util from 'core/util';
import Factory from 'core/utils/factory';
import Runtime from 'runtime';
import {AuthTransport} from 'shared/auth/auth_transports';
import AbstractRuntime from 'shared/abstract_runtime';

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

export default ajax;
