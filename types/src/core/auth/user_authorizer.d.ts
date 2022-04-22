import { InternalAuthOptions, AuthHandler } from './options';
declare const UserAuthorizer: (authOptions: InternalAuthOptions) => AuthHandler;
export default UserAuthorizer;
