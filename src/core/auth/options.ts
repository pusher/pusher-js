export interface ChannelAuthData {
  auth: string;
  channel_data?: string;
  shared_secret?: string;
}

export type ChannelAuthCallback = (
  error: Error | null,
  authData: ChannelAuthData | null,
) => void;

export interface ChannelAuthRequestParams {
  socketId: string;
  channelName: string;
}

export interface ChannelAuthHandler {
  (params: ChannelAuthRequestParams, callback: ChannelAuthCallback): void;
}

export interface UserAuthData {
  auth: string;
  user_data: string;
}


export type UserAuthCallback = (
  error: Error | null,
  authData: UserAuthData | null,
) => void;

export interface UserAuthRequestParams {
  socketId: string;
}

export interface UserAuthHandler {
  (params: UserAuthRequestParams, callback: UserAuthCallback): void;
}


export type AuthTransportCallback = ChannelAuthCallback | UserAuthCallback;

export interface AuthOptions<AuthHandler> {
  transport: 'ajax' | 'jsonp';
  endpoint: string;
  params?: any;
  headers?: any;
  customHandler?: AuthHandler;
}

export interface InternalAuthOptions {
  transport: 'ajax' | 'jsonp';
  endpoint: string;
  params?: any;
  headers?: any;
}
