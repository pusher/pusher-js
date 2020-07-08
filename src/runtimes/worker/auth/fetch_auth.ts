import AbstractRuntime from 'runtimes/interface';
import Logger from 'core/logger';
import { AuthTransport } from 'core/auth/auth_transports';
import { AuthorizerCallback, AuthData } from 'core/auth/options';

var fetchAuth: AuthTransport = function(
  context: AbstractRuntime,
  socketId: string,
  callback: AuthorizerCallback
) {
  var headers = new Headers();
  headers.set('Content-Type', 'application/x-www-form-urlencoded');

  for (var headerName in this.authOptions.headers) {
    headers.set(headerName, this.authOptions.headers[headerName]);
  }

  var body = this.composeQuery(socketId);
  var request = new Request(this.options.authEndpoint, {
    headers,
    body,
    credentials: 'same-origin',
    method: 'POST'
  });

  return fetch(request)
    .then(response => {
      let { status } = response;
      if (status === 200) {
        return response.text();
      } else {
        Logger.error("Couldn't get auth info from your auth endpoint", status);
        throw status;
      }
    })
    .then(data => {
      let parsedData: AuthData;
      try {
        parsedData = JSON.parse(data);
      } catch (e) {
        var message =
          'JSON returned from auth endpoint was invalid, yet status code was 200. Data was: ' +
          data;
        Logger.error(message);
        throw message;
      }
      callback(null, parsedData);
    })
    .catch(err => {
      callback(err, null);
    });
};

export default fetchAuth;
