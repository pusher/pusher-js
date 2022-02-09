import {
  InternalAuthOptions,
  ChannelAuthHandler,
  ChannelAuthRequestParams,
  ChannelAuthCallback
} from './options';

import Runtime from 'runtime';

const composeChannelQuery = (
  params: ChannelAuthRequestParams,
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
): ChannelAuthHandler => {
  if (typeof Runtime.getAuthorizers()[authOptions.transport] === 'undefined') {
    throw `'${authOptions.transport}' is not a recognized auth transport`;
  }

  return (params: ChannelAuthRequestParams, callback: ChannelAuthCallback) => {
    const query = composeChannelQuery(params, authOptions);

    Runtime.getAuthorizers()[authOptions.transport](
      Runtime,
      query,
      authOptions,
      callback
    );
  };
};

export default ChannelAuthorizer;
