import Channel from '../channels/channel';
import {
  AuthorizerCallback,
  AuthHandler,
  NewAuthOptions,
  AuthRequestParams
} from './options';

export interface ChannelAuthorizer {
  authorize(socketId: string, callback: AuthorizerCallback): void;
}

export interface ChannelAuthorizerGenerator {
  (channel: Channel, options: OldAuthorizerOptions): ChannelAuthorizer;
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
  channelAuth: NewAuthOptions,
  channelAuthorizerGenerator: ChannelAuthorizerGenerator
): AuthHandler => {
  const oldAuthOptions: OldAuthorizerOptions = {
    authTransport: channelAuth.transport,
    authEndpoint: channelAuth.endpoint,
    auth: {
      params: channelAuth.params,
      headers: channelAuth.headers
    }
  };
  return (params: AuthRequestParams, callback: AuthorizerCallback) => {
    const channel = pusher.channel(params.channelName);
    // This line creates a new channel authorizer every time.
    // In the past, this was only done once per channel and reused.
    // We can do that again if we want to keep this behavior intact.
    const channelAuthorizer = channelAuthorizerGenerator(
      channel,
      oldAuthOptions
    );
    channelAuthorizer.authorize(params.socketId, callback);
  };
};
