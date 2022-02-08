import { InternalAuthOptions, UserAuthHandler } from './options';
declare const UserAuthenticator: (authOptions: InternalAuthOptions) => UserAuthHandler;
export default UserAuthenticator;
