import AbstractRuntime from '../runtimes/interface';
import Runtime from 'runtime';
import * as Collections from './utils/collections';
import Channels from './channels/channels';
import Channel from './channels/channel';
import { default as EventsDispatcher } from './events/dispatcher';
import Timeline from './timeline/timeline';
import TimelineSender from './timeline/timeline_sender';
import TimelineLevel from './timeline/level';
import { defineTransport } from './strategies/strategy_builder';
import ConnectionManager from './connection/connection_manager';
import { PeriodicTimer } from './utils/timers';
import Defaults from './defaults';
import Logger from './logger';
import Factory from './utils/factory';
import { Options, ClusterOptions, validateOptions } from './options';
import { Config, getConfig } from './config';
import StrategyOptions from './strategies/strategy_options';
import UserFacade from './user';

export default class Pusher {
  /*  STATIC PROPERTIES */
  static instances: Pusher[] = [];
  static isReady: boolean = false;
  static logToConsole: boolean = false;

  // for jsonp
  static Runtime: AbstractRuntime = Runtime;
  static ScriptReceivers: any = (<any>Runtime).ScriptReceivers;
  static DependenciesReceivers: any = (<any>Runtime).DependenciesReceivers;
  static auth_callbacks: any = (<any>Runtime).auth_callbacks;

  static ready() {
    Pusher.isReady = true;
    for (var i = 0, l = Pusher.instances.length; i < l; i++) {
      Pusher.instances[i].connect();
    }
  }

  static log: (message: any) => void;

  private static getClientFeatures(): string[] {
    return Collections.keys(
      Collections.filterObject({ ws: Runtime.Transports.ws }, function(t) {
        return t.isSupported({});
      })
    );
  }

  /* INSTANCE PROPERTIES */
  key: string;
  options: Options;
  config: Config;
  channels: Channels;
  global_emitter: EventsDispatcher;
  sessionID: number;
  timeline: Timeline;
  timelineSender: TimelineSender;
  connection: ConnectionManager;
  timelineSenderTimer: PeriodicTimer;
  user: UserFacade;
  constructor(app_key: string, options: Options) {
    checkAppKey(app_key);
    validateOptions(options);
    this.key = app_key;
    this.options = options;
    this.config = getConfig(this.options, this);

    this.channels = Factory.createChannels();
    this.global_emitter = new EventsDispatcher();
    this.sessionID = Runtime.randomInt(1000000000);

    this.timeline = new Timeline(this.key, this.sessionID, {
      cluster: this.config.cluster,
      features: Pusher.getClientFeatures(),
      params: this.config.timelineParams || {},
      limit: 50,
      level: TimelineLevel.INFO,
      version: Defaults.VERSION
    });
    if (this.config.enableStats) {
      this.timelineSender = Factory.createTimelineSender(this.timeline, {
        host: this.config.statsHost,
        path: '/timeline/v2/' + Runtime.TimelineTransport.name
      });
    }

    var getStrategy = (options: StrategyOptions) => {
      return Runtime.getDefaultStrategy(this.config, options, defineTransport);
    };

    this.connection = Factory.createConnectionManager(this.key, {
      getStrategy: getStrategy,
      timeline: this.timeline,
      activityTimeout: this.config.activityTimeout,
      pongTimeout: this.config.pongTimeout,
      unavailableTimeout: this.config.unavailableTimeout,
      useTLS: Boolean(this.config.useTLS)
    });

    this.connection.bind('connected', () => {
      this.subscribeAll();
      if (this.timelineSender) {
        this.timelineSender.send(this.connection.isUsingTLS());
      }
    });

    this.connection.bind('message', event => {
      var eventName = event.event;
      var internal = eventName.indexOf('pusher_internal:') === 0;
      if (event.channel) {
        var channel = this.channel(event.channel);
        if (channel) {
          channel.handleEvent(event);
        }
      }
      // Emit globally [deprecated]
      if (!internal) {
        this.global_emitter.emit(event.event, event.data);
      }
    });
    this.connection.bind('connecting', () => {
      this.channels.disconnect();
    });
    this.connection.bind('disconnected', () => {
      this.channels.disconnect();
    });
    this.connection.bind('error', err => {
      Logger.warn(err);
    });

    Pusher.instances.push(this);
    this.timeline.info({ instances: Pusher.instances.length });

    this.user = new UserFacade(this);

    if (Pusher.isReady) {
      this.connect();
    }
  }

  /**
   * Allows you to switch Pusher cluster without
   * losing all the channels/subscription binding
   * as this is internally managed by the SDK.
   */
  switchCluster(options: ClusterOptions) {
    const { appKey, cluster } = options;
    this.key = appKey;
    this.options = { ...this.options, cluster };
    this.config = getConfig(this.options, this);
    this.connection.switchCluster(this.key);
  }

  channel(name: string): Channel {
    return this.channels.find(name);
  }

  allChannels(): Channel[] {
    return this.channels.all();
  }

  connect() {
    this.connection.connect();

    if (this.timelineSender) {
      if (!this.timelineSenderTimer) {
        var usingTLS = this.connection.isUsingTLS();
        var timelineSender = this.timelineSender;
        this.timelineSenderTimer = new PeriodicTimer(60000, function() {
          timelineSender.send(usingTLS);
        });
      }
    }
  }

  disconnect() {
    this.connection.disconnect();

    if (this.timelineSenderTimer) {
      this.timelineSenderTimer.ensureAborted();
      this.timelineSenderTimer = null;
    }
  }

  bind(event_name: string, callback: Function, context?: any): Pusher {
    this.global_emitter.bind(event_name, callback, context);
    return this;
  }

  unbind(event_name?: string, callback?: Function, context?: any): Pusher {
    this.global_emitter.unbind(event_name, callback, context);
    return this;
  }

  bind_global(callback: Function): Pusher {
    this.global_emitter.bind_global(callback);
    return this;
  }

  unbind_global(callback?: Function): Pusher {
    this.global_emitter.unbind_global(callback);
    return this;
  }

  unbind_all(callback?: Function): Pusher {
    this.global_emitter.unbind_all();
    return this;
  }

  subscribeAll() {
    var channelName;
    for (channelName in this.channels.channels) {
      if (this.channels.channels.hasOwnProperty(channelName)) {
        this.subscribe(channelName);
      }
    }
  }

  subscribe(channel_name: string) {
    var channel = this.channels.add(channel_name, this);
    if (channel.subscriptionPending && channel.subscriptionCancelled) {
      channel.reinstateSubscription();
    } else if (
      !channel.subscriptionPending &&
      this.connection.state === 'connected'
    ) {
      channel.subscribe();
    }
    return channel;
  }

  unsubscribe(channel_name: string) {
    var channel = this.channels.find(channel_name);
    if (channel && channel.subscriptionPending) {
      channel.cancelSubscription();
    } else {
      channel = this.channels.remove(channel_name);
      if (channel && channel.subscribed) {
        channel.unsubscribe();
      }
    }
  }

  send_event(event_name: string, data: any, channel?: string) {
    return this.connection.send_event(event_name, data, channel);
  }

  shouldUseTLS(): boolean {
    return this.config.useTLS;
  }

  signin() {
    this.user.signin();
  }
}

function checkAppKey(key) {
  if (key === null || key === undefined) {
    throw 'You must pass your app key when you instantiate Pusher.';
  }
}

Runtime.setup(Pusher);
