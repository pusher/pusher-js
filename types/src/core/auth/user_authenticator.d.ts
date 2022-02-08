import { InternalAuthOptions, AuthHandler } from './options';
declare const UserAuthenticator: (authOptions: InternalAuthOptions) => AuthHandler;
export default UserAuthenticator;
