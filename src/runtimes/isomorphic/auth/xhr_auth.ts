import TimelineSender from 'core/timeline/timeline_sender';
import * as Collections from 'core/utils/collections';
import Util from 'core/util';
import Runtime from 'runtime';
import { AuthTransport } from 'core/auth/auth_transports';
import AbstractRuntime from 'runtimes/interface';
import UrlStore from 'core/utils/url_store';
import { AuthorizerCallback } from 'core/auth/options';
import { HTTPAuthError } from 'core/errors';

var ajax: AuthTransport = function(
  context: AbstractRuntime,
  socketId: string,
  callback: AuthorizerCallback
) {
  var self = this,
    xhr;

  xhr = Runtime.createXHR();
  xhr.open('POST', self.options.authEndpoint, true);

  // add request headers
  xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
  for (var headerName in this.authOptions.headers) {
    xhr.setRequestHeader(headerName, this.authOptions.headers[headerName]);
  }

  xhr.onreadystatechange = function() {
    if (xhr.readyState === 4) {
      if (xhr.status === 200) {
        let data;
        let parsed = false;

        try {
          data = JSON.parse(xhr.responseText);
          parsed = true;
        } catch (e) {
          callback(
            new HTTPAuthError(
              200,
              'JSON returned from auth endpoint was invalid, yet status code was 200. Data was: ' +
                xhr.responseText
            ),
            { auth: '' }
          );
        }

        if (parsed) {
          // prevents double execution.
          callback(null, data);
        }
      } else {
        var suffix = UrlStore.buildLogSuffix('authenticationEndpoint');
        callback(
          new HTTPAuthError(
            xhr.status,
            'Unable to retrieve auth string from auth endpoint - ' +
              `received status: ${xhr.status} from ${self.options.authEndpoint}. ` +
              `Clients must be authenticated to join private or presence channels. ${suffix}`
          ),
          { auth: '' }
        );
      }
    }
  };

  xhr.send(this.composeQuery(socketId));
  return xhr;
};

export default ajax;
