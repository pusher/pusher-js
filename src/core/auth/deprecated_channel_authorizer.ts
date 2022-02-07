import Channel from '../channels/channel';
import {
  AuthorizerCallback,
  AuthHandler,
  AuthRequestParams,
  InternalAuthOptions
} from './options';

export interface OldChannelAuthorizer {
  authorize(socketId: string, callback: AuthorizerCallback): void;
}

export interface ChannelAuthorizerGenerator {
  (channel: Channel, options: OldAuthorizerOptions): OldChannelAuthorizer;
}

export interface OldAuthOptions {
  params?: any;
  headers?: any;
}

export interface OldAuthorizerOptions {
  authTransport: 'ajax' | 'jsonp';
  authEndpoint: string;
  auth?: OldAuthOptions;
}

export const ChannelAuthorizerProxy = (
  pusher,
  authOptions: InternalAuthOptions,
  channelAuthorizerGenerator: ChannelAuthorizerGenerator
): AuthHandler => {
  const oldAuthOptions: OldAuthorizerOptions = {
    authTransport: authOptions.transport,
    authEndpoint: authOptions.endpoint,
    auth: {
      params: authOptions.params,
      headers: authOptions.headers
    }
  };
  return (params: AuthRequestParams, callback: AuthorizerCallback) => {
    const channel = pusher.channel(params.channelName);
    // This line creates a new channel authorizer every time.
    // In the past, this was only done once per channel and reused.
    // We can do that again if we want to keep this behavior intact.
    const channelAuthorizer: OldChannelAuthorizer = channelAuthorizerGenerator(
      channel,
      oldAuthOptions
    );
    channelAuthorizer.authorize(params.socketId, callback);
  };
};
