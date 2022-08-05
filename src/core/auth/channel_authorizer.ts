import {
  AuthRequestType,
  InternalAuthOptions,
  ChannelAuthorizationHandler,
  ChannelAuthorizationRequestParams,
  ChannelAuthorizationCallback
} from './options';

import Runtime from 'runtime';

const composeChannelQuery = (
  params: ChannelAuthorizationRequestParams,
  authOptions: InternalAuthOptions
) => {
  var query = 'socket_id=' + encodeURIComponent(params.socketId);

  query += '&channel_name=' + encodeURIComponent(params.channelName);

  for (var i in authOptions.params) {
    query +=
      '&' +
      encodeURIComponent(i) +
      '=' +
      encodeURIComponent(authOptions.params[i]);
  }

  return query;
};

const ChannelAuthorizer = (
  authOptions: InternalAuthOptions
): ChannelAuthorizationHandler => {
  if (typeof Runtime.getAuthorizers()[authOptions.transport] === 'undefined') {
    throw `'${authOptions.transport}' is not a recognized auth transport`;
  }

  return (
    params: ChannelAuthorizationRequestParams,
    callback: ChannelAuthorizationCallback
  ) => {
    const query = composeChannelQuery(params, authOptions);

    Runtime.getAuthorizers()[authOptions.transport](
      Runtime,
      query,
      authOptions,
      AuthRequestType.ChannelAuthorization,
      callback
    );
  };
};

export default ChannelAuthorizer;
