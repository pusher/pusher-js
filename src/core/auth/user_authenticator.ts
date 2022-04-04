import {
  UserAuthenticationCallback,
  InternalAuthOptions,
  UserAuthenticationHandler,
  UserAuthenticationRequestParams,
  AuthRequestType
} from './options';

import Runtime from 'runtime';

const composeChannelQuery = (
  params: UserAuthenticationRequestParams,
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

const UserAuthenticator = (
  authOptions: InternalAuthOptions
): UserAuthenticationHandler => {
  if (typeof Runtime.getAuthorizers()[authOptions.transport] === 'undefined') {
    throw `'${authOptions.transport}' is not a recognized auth transport`;
  }

  return (
    params: UserAuthenticationRequestParams,
    callback: UserAuthenticationCallback
  ) => {
    const query = composeChannelQuery(params, authOptions);

    Runtime.getAuthorizers()[authOptions.transport](
      Runtime,
      query,
      authOptions,
      AuthRequestType.UserAuthentication,
      callback
    );
  };
};

export default UserAuthenticator;
