import TimelineSender from 'core/timeline/timeline_sender';
import * as Collections from 'core/utils/collections';
import Util from 'core/util';
import Runtime from 'runtime';
import { AuthTransport } from 'core/auth/auth_transports';
import AbstractRuntime from 'runtimes/interface';
import UrlStore from 'core/utils/url_store';
import {
  AuthRequestType,
  AuthTransportCallback,
  InternalAuthOptions,
} from 'core/auth/options';
import { HTTPAuthError } from 'core/errors';

const ajax: AuthTransport = function (
  context: AbstractRuntime,
  query: string,
  authOptions: InternalAuthOptions,
  authRequestType: AuthRequestType,
  callback: AuthTransportCallback,
) {
  const xhr = Runtime.createXHR();
  xhr.open('POST', authOptions.endpoint, true);

  // add request headers
  xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
  for (var headerName in authOptions.headers) {
    xhr.setRequestHeader(headerName, authOptions.headers[headerName]);
  }
  if (authOptions.headersProvider != null) {
    let dynamicHeaders = authOptions.headersProvider();
    for (var headerName in dynamicHeaders) {
      xhr.setRequestHeader(headerName, dynamicHeaders[headerName]);
    }
  }

  xhr.onreadystatechange = function () {
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
              `JSON returned from ${authRequestType.toString()} endpoint was invalid, yet status code was 200. Data was: ${
                xhr.responseText
              }`,
            ),
            null,
          );
        }

        if (parsed) {
          // prevents double execution.
          callback(null, data);
        }
      } else {
        let suffix = '';
        switch (authRequestType) {
          case AuthRequestType.UserAuthentication:
            suffix = UrlStore.buildLogSuffix('authenticationEndpoint');
            break;
          case AuthRequestType.ChannelAuthorization:
            suffix = `Clients must be authorized to join private or presence channels. ${UrlStore.buildLogSuffix(
              'authorizationEndpoint',
            )}`;
            break;
        }
        callback(
          new HTTPAuthError(
            xhr.status,
            `Unable to retrieve auth string from ${authRequestType.toString()} endpoint - ` +
              `received status: ${xhr.status} from ${authOptions.endpoint}. ${suffix}`,
          ),
          null,
        );
      }
    }
  };

  xhr.send(query);
  return xhr;
};

export default ajax;
