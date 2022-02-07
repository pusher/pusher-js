import { InternalAuthOptions, AuthHandler } from './options';
declare const ChannelAuthorizer: (authOptions: InternalAuthOptions) => AuthHandler;
export default ChannelAuthorizer;
