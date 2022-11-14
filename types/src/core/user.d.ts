import Pusher from './pusher';
import Channel from './channels/channel';
import WatchlistFacade from './watchlist';
import EventsDispatcher from './events/dispatcher';
export default class UserFacade extends EventsDispatcher {
    pusher: Pusher;
    signin_requested: boolean;
    user_data: any;
    serverToUserChannel: Channel;
    signinDonePromise: Promise<any>;
    watchlist: WatchlistFacade;
    private _signinDoneResolve;
    constructor(pusher: Pusher);
    signin(): void;
    private _signin;
    private _onAuthorize;
    private _onSigninSuccess;
    private _subscribeChannels;
    private _cleanup;
    private _newSigninPromiseIfNeeded;
}
