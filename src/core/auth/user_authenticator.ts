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

  for (var key in authOptions.params) {
    query +=
      '&' +
      encodeURIComponent(key) +
      '=' +
      encodeURIComponent(authOptions.params[key]);
  }

  if (authOptions.paramsProvider != null) {
    let dynamicParams = authOptions.paramsProvider();
    for (var key in dynamicParams) {
      query +=
        '&' +
        encodeURIComponent(key) +
        '=' +
        encodeURIComponent(dynamicParams[key]);
    }
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
