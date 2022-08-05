import AbstractRuntime from 'runtimes/interface';
import { AuthTransport } from 'core/auth/auth_transports';
import {
  AuthRequestType,
  AuthTransportCallback,
  InternalAuthOptions
} from 'core/auth/options';
import { HTTPAuthError } from 'core/errors';

var fetchAuth: AuthTransport = function(
  context: AbstractRuntime,
  query: string,
  authOptions: InternalAuthOptions,
  authRequestType: AuthRequestType,
  callback: AuthTransportCallback
) {
  var headers = new Headers();
  headers.set('Content-Type', 'application/x-www-form-urlencoded');

  for (var headerName in authOptions.headers) {
    headers.set(headerName, authOptions.headers[headerName]);
  }

  var body = query;
  var request = new Request(authOptions.endpoint, {
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
        `Could not get ${authRequestType.toString()} info from your auth endpoint, status: ${status}`
      );
    })
    .then(data => {
      let parsedData;
      try {
        parsedData = JSON.parse(data);
      } catch (e) {
        throw new HTTPAuthError(
          200,
          `JSON returned from ${authRequestType.toString()} endpoint was invalid, yet status code was 200. Data was: ${data}`
        );
      }
      callback(null, parsedData);
    })
    .catch(err => {
      callback(err, null);
    });
};

export default fetchAuth;
