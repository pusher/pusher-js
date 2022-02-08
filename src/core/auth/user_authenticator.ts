import {
  AuthorizerCallback,
  InternalAuthOptions,
  AuthHandler,
  AuthRequestParams
} from './options';

import Runtime from 'runtime';

const composeChannelQuery = (
  params: AuthRequestParams,
  authOptions: InternalAuthOptions
) => {
  var query = 'socket_id=' + encodeURIComponent(params.socketId);

  for (var i in authOptions.params) {
    query +=
      '&' +
      encodeURIComponent(i) +
      '=' +
      encodeURIComponent(authOptions.params[i]);
  }

  return query;
};

const UserAuthenticator = (authOptions: InternalAuthOptions): AuthHandler => {
  if (typeof Runtime.getAuthorizers()[authOptions.transport] === 'undefined') {
    throw `'${authOptions.transport}' is not a recognized auth transport`;
  }

  return (params: AuthRequestParams, callback: AuthorizerCallback) => {
    const query = composeChannelQuery(params, authOptions);

    Runtime.getAuthorizers()[authOptions.transport](
      Runtime,
      query,
      authOptions,
      callback
    );
  };
};

export default UserAuthenticator;
