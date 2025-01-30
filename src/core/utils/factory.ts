import AssistantToTheTransportManager from '../transports/assistant_to_the_transport_manager';
import PingDelayOptions from '../transports/ping_delay_options';
import Transport from '../transports/transport';
import TransportManager from '../transports/transport_manager';
import Handshake from '../connection/handshake';
import TransportConnection from '../transports/transport_connection';
import SocketHooks from '../http/socket_hooks';
import HTTPSocket from '../http/http_socket';

import Timeline from '../timeline/timeline';
import {
  default as TimelineSender,
  TimelineSenderOptions,
} from '../timeline/timeline_sender';
import PresenceChannel from '../channels/presence_channel';
import PrivateChannel from '../channels/private_channel';
import EncryptedChannel from '../channels/encrypted_channel';
import Channel from '../channels/channel';
import ConnectionManager from '../connection/connection_manager';
import ConnectionManagerOptions from '../connection/connection_manager_options';
import Ajax from '../http/ajax';
import Channels from '../channels/channels';
import Pusher from '../pusher';
import { Config } from '../config';
import * as nacl from 'tweetnacl';

var Factory = {
  createChannels(): Channels {
    return new Channels();
  },

  createConnectionManager(
    key: string,
    options: ConnectionManagerOptions,
  ): ConnectionManager {
    return new ConnectionManager(key, options);
  },

  createChannel(name: string, pusher: Pusher): Channel {
    return new Channel(name, pusher);
  },

  createPrivateChannel(name: string, pusher: Pusher): PrivateChannel {
    return new PrivateChannel(name, pusher);
  },

  createPresenceChannel(name: string, pusher: Pusher): PresenceChannel {
    return new PresenceChannel(name, pusher);
  },

  createEncryptedChannel(
    name: string,
    pusher: Pusher,
    nacl: nacl,
  ): EncryptedChannel {
    return new EncryptedChannel(name, pusher, nacl);
  },

  createTimelineSender(timeline: Timeline, options: TimelineSenderOptions) {
    return new TimelineSender(timeline, options);
  },

  createHandshake(
    transport: TransportConnection,
    callback: (HandshakePayload) => void,
  ): Handshake {
    return new Handshake(transport, callback);
  },

  createAssistantToTheTransportManager(
    manager: TransportManager,
    transport: Transport,
    options: PingDelayOptions,
  ): AssistantToTheTransportManager {
    return new AssistantToTheTransportManager(manager, transport, options);
  },
};

export default Factory;
