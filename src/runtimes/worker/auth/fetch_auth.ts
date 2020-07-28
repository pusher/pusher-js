import AbstractRuntime from 'runtimes/interface';
import { AuthTransport } from 'core/auth/auth_transports';
import { AuthorizerCallback, AuthData } from 'core/auth/options';
import { HTTPAuthError } from 'core/errors';

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
        // manually parse the json so we can provide a more helpful error in
        // failure case
        return response.text();
      }
      throw new HTTPAuthError(
        200,
        `Could not get auth info from your auth endpoint, status: ${status}`
      );
    })
    .then(data => {
      let parsedData: AuthData;
      try {
        parsedData = JSON.parse(data);
      } catch (e) {
        throw new HTTPAuthError(
          200,
          'JSON returned from auth endpoint was invalid, yet status code was 200. Data was: ' +
            data
        );
      }
      callback(null, parsedData);
    })
    .catch(err => {
      callback(err, { auth: '' });
    });
};

export default fetchAuth;
