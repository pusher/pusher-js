import {
  AuthRequestType,
  InternalAuthOptions,
  ChannelAuthorizationHandler,
  ChannelAuthorizationRequestParams,
  ChannelAuthorizationCallback,
} from './options';

import Runtime from 'runtime';

const composeChannelQuery = (
  params: ChannelAuthorizationRequestParams,
  authOptions: InternalAuthOptions,
) => {
  var query = 'socket_id=' + encodeURIComponent(params.socketId);

  query += '&channel_name=' + encodeURIComponent(params.channelName);

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

const ChannelAuthorizer = (
  authOptions: InternalAuthOptions,
): ChannelAuthorizationHandler => {
  if (typeof Runtime.getAuthorizers()[authOptions.transport] === 'undefined') {
    throw `'${authOptions.transport}' is not a recognized auth transport`;
  }

  return (
    params: ChannelAuthorizationRequestParams,
    callback: ChannelAuthorizationCallback,
  ) => {
    const query = composeChannelQuery(params, authOptions);

    Runtime.getAuthorizers()[authOptions.transport](
      Runtime,
      query,
      authOptions,
      AuthRequestType.ChannelAuthorization,
      callback,
    );
  };
};

export default ChannelAuthorizer;
