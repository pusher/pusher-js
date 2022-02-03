import { AuthorizerCallback, NewAuthOptions, AuthHandler, AuthRequestParams } from './options';

import Runtime from 'runtime';


const composeChannelQuery = (params: AuthRequestParams, userAuth : NewAuthOptions) => {
  var query =
  'socket_id=' +
  encodeURIComponent(params.socketId);

  for (var i in userAuth.params) {
    query +=
      '&' +
      encodeURIComponent(i) +
      '=' +
      encodeURIComponent(userAuth.params[i]);
  }

  return query;
}

export const UserAuthorizer = (userAuth : NewAuthOptions) : AuthHandler => {
  if (typeof Runtime.getAuthorizers()[userAuth.transport] === 'undefined') {
    throw `'${userAuth.transport}' is not a recognized auth transport`;
  }

  return (params: AuthRequestParams, callback: AuthorizerCallback) => {
    const query = composeChannelQuery(params, userAuth);

    Runtime.getAuthorizers()[userAuth.transport](
      Runtime,
      query,
      userAuth,
      callback
    );
  }
}
