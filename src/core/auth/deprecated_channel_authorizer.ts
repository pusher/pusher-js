import Channel from '../channels/channel';
import {
  ChannelAuthCallback,
  ChannelAuthHandler,
  ChannelAuthRequestParams,
  InternalAuthOptions
} from './options';

export interface DeprecatedChannelAuthorizer {
  authorize(socketId: string, callback: ChannelAuthCallback): void;
}

export interface ChannelAuthorizerGenerator {
  (
    channel: Channel,
    options: DeprecatedAuthorizerOptions
  ): DeprecatedChannelAuthorizer;
}

export interface DeprecatedAuthOptions {
  params?: any;
  headers?: any;
}

export interface DeprecatedAuthorizerOptions {
  authTransport: 'ajax' | 'jsonp';
  authEndpoint: string;
  auth?: DeprecatedAuthOptions;
}

export const ChannelAuthorizerProxy = (
  pusher,
  authOptions: InternalAuthOptions,
  channelAuthorizerGenerator: ChannelAuthorizerGenerator
): ChannelAuthHandler => {
  const deprecatedAuthorizerOptions: DeprecatedAuthorizerOptions = {
    authTransport: authOptions.transport,
    authEndpoint: authOptions.endpoint,
    auth: {
      params: authOptions.params,
      headers: authOptions.headers
    }
  };
  return (params: ChannelAuthRequestParams, callback: ChannelAuthCallback) => {
    const channel = pusher.channel(params.channelName);
    // This line creates a new channel authorizer every time.
    // In the past, this was only done once per channel and reused.
    // We can do that again if we want to keep this behavior intact.
    const channelAuthorizer: DeprecatedChannelAuthorizer = channelAuthorizerGenerator(
      channel,
      deprecatedAuthorizerOptions
    );
    channelAuthorizer.authorize(params.socketId, callback);
  };
};
