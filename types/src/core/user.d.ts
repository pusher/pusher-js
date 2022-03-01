import Pusher from './pusher';
import Channel from './channels/channel';
export default class UserFacade {
    pusher: Pusher;
    signin_requested: boolean;
    user_data: any;
    serverToUserChannel: Channel;
    constructor(pusher: Pusher);
    signin(): void;
    private _signin;
    private _onSigninSuccess;
    private _subscribeChannels;
    private _disconnect;
}
