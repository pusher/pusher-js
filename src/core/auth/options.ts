export enum AuthRequestType {
  UserAuthentication = 'user-authentication',
  ChannelAuthorization = 'channel-authorization',
}

export interface ChannelAuthorizationData {
  auth: string;
  channel_data?: string;
  shared_secret?: string;
}

export type ChannelAuthorizationCallback = (
  error: Error | null,
  authData: ChannelAuthorizationData | null,
) => void;

export interface ChannelAuthorizationRequestParams {
  socketId: string;
  channelName: string;
}

export interface ChannelAuthorizationHandler {
  (
    params: ChannelAuthorizationRequestParams,
    callback: ChannelAuthorizationCallback,
  ): void;
}

export interface UserAuthenticationData {
  auth: string;
  user_data: string;
}

export type UserAuthenticationCallback = (
  error: Error | null,
  authData: UserAuthenticationData | null,
) => void;

export interface UserAuthenticationRequestParams {
  socketId: string;
}

export interface UserAuthenticationHandler {
  (
    params: UserAuthenticationRequestParams,
    callback: UserAuthenticationCallback,
  ): void;
}

export type AuthTransportCallback =
  | ChannelAuthorizationCallback
  | UserAuthenticationCallback;

export interface InternalAuthOptions {
  transport: 'ajax' | 'jsonp';
  endpoint: string;
  params?: any;
  headers?: any;
  paramsProvider?: () => any;
  headersProvider?: () => any;
}

export type CustomAuthOptions<AuthHandler> = {
  customHandler: AuthHandler;
};

export type AuthOptionsT<AuthHandler> =
  | InternalAuthOptions
  | CustomAuthOptions<AuthHandler>;

// The options that an app gives. transport and endpoint have defaults (see
// Defaults), so the app can leave them out.
export declare type UserAuthenticationOptions =
  | Partial<InternalAuthOptions>
  | CustomAuthOptions<UserAuthenticationHandler>;
export declare type ChannelAuthorizationOptions =
  | Partial<InternalAuthOptions>
  | CustomAuthOptions<ChannelAuthorizationHandler>;
