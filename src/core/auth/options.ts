
export interface AuthData {
  auth: string;
  channel_data?: string;
  shared_secret?: string;
  user_data?: string;
}

export type AuthorizerCallback = (
  error: Error | null,
  authData: AuthData
) => void;


export interface AuthRequestParams {
  socketId: string;
  channelName?: string;
}

export interface AuthHandler {
  (params: AuthRequestParams, callback: AuthorizerCallback): void;
}

export interface NewAuthOptions {
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
