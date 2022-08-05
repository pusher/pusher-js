import { InternalAuthOptions, UserAuthenticationHandler } from './options';
declare const UserAuthenticator: (authOptions: InternalAuthOptions) => UserAuthenticationHandler;
export default UserAuthenticator;
