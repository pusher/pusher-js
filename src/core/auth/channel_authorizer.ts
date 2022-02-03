import {
  AuthorizerCallback,
  NewAuthOptions,
  AuthHandler,
  AuthRequestParams
} from './options';

import Runtime from 'runtime';

const composeChannelQuery = (
  params: AuthRequestParams,
  channelAuth: NewAuthOptions
) => {
  var query = 'socket_id=' + encodeURIComponent(params.socketId);

  query += '&channel_name=' + encodeURIComponent(params.channelName);

  for (var i in channelAuth.params) {
    query +=
      '&' +
      encodeURIComponent(i) +
      '=' +
      encodeURIComponent(channelAuth.params[i]);
  }

  return query;
};

export const ChannelAuthorizer = (channelAuth: NewAuthOptions): AuthHandler => {
  if (typeof Runtime.getAuthorizers()[channelAuth.transport] === 'undefined') {
    throw `'${channelAuth.transport}' is not a recognized auth transport`;
  }

  return (params: AuthRequestParams, callback: AuthorizerCallback) => {
    const query = composeChannelQuery(params, channelAuth);

    Runtime.getAuthorizers()[channelAuth.transport](
      Runtime,
      query,
      channelAuth,
      callback
    );
  };
};
