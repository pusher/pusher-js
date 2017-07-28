import Logger from 'core/logger';
import TimelineSender from 'core/timeline/timeline_sender'
import * as Collections from 'core/utils/collections';
import Util from 'core/util';
import Runtime from 'runtime';
import {AuthTransport} from 'core/auth/auth_transports';
import AbstractRuntime from 'runtimes/interface';
import UrlStore from 'core/utils/url_store';

var ajax : AuthTransport = function(context : AbstractRuntime, socketId, callback){
  var self = this, xhr;

  xhr = Runtime.createXHR();
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
        var suffix = UrlStore.buildLogSuffix("authenticationEndpoint");
        Logger.warn(
          `Couldn't retrieve authentication info. ${xhr.status}` +
          `Clients must be authenticated to join private or presence channels. ${suffix}`
        );
        callback(true, xhr.status);
      }
    }
  };

  xhr.send(this.composeQuery(socketId));
  return xhr;
}

export default ajax;
