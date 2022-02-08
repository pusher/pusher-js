import {
  UserAuthCallback,
  InternalAuthOptions,
  UserAuthHandler,
  UserAuthRequestParams
} from './options';

import Runtime from 'runtime';

const composeChannelQuery = (
  params: UserAuthRequestParams,
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

const UserAuthenticator = (authOptions: InternalAuthOptions): UserAuthHandler => {
  if (typeof Runtime.getAuthorizers()[authOptions.transport] === 'undefined') {
    throw `'${authOptions.transport}' is not a recognized auth transport`;
  }

  return (params: UserAuthRequestParams, callback: UserAuthCallback) => {
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
