import Pusher from './pusher';
import Logger from './logger';
import {
  UserAuthenticationData,
  UserAuthenticationCallback
} from './auth/options';
import Channel from './channels/channel';
import WatchlistFacade from './watchlist';
import EventsDispatcher from './events/dispatcher';
import flatPromise from './utils/flat_promise';

export default class UserFacade extends EventsDispatcher {
  pusher: Pusher;
  signin_requested: boolean = false;
  user_data: any = null;
  serverToUserChannel: Channel = null;
  signinDonePromise: Promise<any> = null;
  watchlist: WatchlistFacade;
  private _signinDoneResolve: Function = null;

  public constructor(pusher: Pusher) {
    super(function(eventName, data) {
      Logger.debug('No callbacks on user for ' + eventName);
    });
    this.pusher = pusher;
    this.pusher.connection.bind('state_change', ({ previous, current }) => {
      if (previous !== 'connected' && current === 'connected') {
        this._signin();
      }
      if (previous === 'connected' && current !== 'connected') {
        this._cleanup();
        this._newSigninPromiseIfNeeded();
      }
    });

    this.watchlist = new WatchlistFacade(pusher);

    this.pusher.connection.bind('message', event => {
      var eventName = event.event;
      if (eventName === 'pusher:signin_success') {
        this._onSigninSuccess(event.data);
      }
      if (
        this.serverToUserChannel &&
        this.serverToUserChannel.name === event.channel
      ) {
        this.serverToUserChannel.handleEvent(event);
      }
    });
  }

  public signin() {
    if (this.signin_requested) {
      return;
    }

    this.signin_requested = true;
    this._signin();
  }

  private _signin() {
    if (!this.signin_requested) {
      return;
    }

    this._newSigninPromiseIfNeeded();

    if (this.pusher.connection.state !== 'connected') {
      // Signin will be attempted when the connection is connected
      return;
    }

    this.pusher.config.userAuthenticator(
      {
        socketId: this.pusher.connection.socket_id
      },
      this._onAuthorize
    );
  }

  private _onAuthorize: UserAuthenticationCallback = (
    err,
    authData: UserAuthenticationData
  ) => {
    if (err) {
      Logger.warn(`Error during signin: ${err}`);
      this._cleanup();
      return;
    }

    this.pusher.send_event('pusher:signin', {
      auth: authData.auth,
      user_data: authData.user_data
    });

    // Later when we get pusher:singin_success event, the user will be marked as signed in
  };

  private _onSigninSuccess(data: any) {
    try {
      this.user_data = JSON.parse(data.user_data);
    } catch (e) {
      Logger.error(`Failed parsing user data after signin: ${data.user_data}`);
      this._cleanup();
      return;
    }

    if (typeof this.user_data.id !== 'string' || this.user_data.id === '') {
      Logger.error(
        `user_data doesn't contain an id. user_data: ${this.user_data}`
      );
      this._cleanup();
      return;
    }

    // Signin succeeded
    this._signinDoneResolve();
    this._subscribeChannels();
  }

  private _subscribeChannels() {
    const ensure_subscribed = channel => {
      if (channel.subscriptionPending && channel.subscriptionCancelled) {
        channel.reinstateSubscription();
      } else if (
        !channel.subscriptionPending &&
        this.pusher.connection.state === 'connected'
      ) {
        channel.subscribe();
      }
    };

    this.serverToUserChannel = new Channel(
      `#server-to-user-${this.user_data.id}`,
      this.pusher
    );
    this.serverToUserChannel.bind_global((eventName, data) => {
      if (
        eventName.indexOf('pusher_internal:') === 0 ||
        eventName.indexOf('pusher:') === 0
      ) {
        // ignore internal events
        return;
      }
      this.emit(eventName, data);
    });
    ensure_subscribed(this.serverToUserChannel);
  }

  private _cleanup() {
    this.user_data = null;
    if (this.serverToUserChannel) {
      this.serverToUserChannel.unbind_all();
      this.serverToUserChannel.disconnect();
      this.serverToUserChannel = null;
    }

    if (this.signin_requested) {
      // If signin is in progress and cleanup is called,
      // Mark the current signin process as done.
      this._signinDoneResolve();
    }
  }

  private _newSigninPromiseIfNeeded() {
    if (!this.signin_requested) {
      return;
    }

    // If there is a promise and it is not resolved, return without creating a new one.
    if (this.signinDonePromise && !(this.signinDonePromise as any).done) {
      return;
    }

    // This promise is never rejected.
    // It gets resolved when the signin process is done whether it failed or succeeded
    const { promise, resolve, reject: _ } = flatPromise();
    (promise as any).done = false;
    const setDone = () => {
      (promise as any).done = true;
    };
    promise.then(setDone).catch(setDone);
    this.signinDonePromise = promise;
    this._signinDoneResolve = resolve;
  }
}
