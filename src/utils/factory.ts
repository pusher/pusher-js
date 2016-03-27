import SocketHooks from "../http/socket_hooks";
import HTTPSocket from "../http/http_socket";
import Authorizer from "../pusher_authorizer";
import Timeline from "../timeline/timeline";
import TimelineSender from "../timeline/timeline_sender";
import PresenceChannel from "../channels/presence_channel";
import PrivateChannel from "../channels/private_channel";
import Channel from "../channels/channel";
import ConnectionManager from "../connection/connection_manager";
import Ajax from "../http/ajax";
import XHR from "pusher-websocket-iso-externals-node/xhr";
import Channels from "../channels/channels";
import {Network, NetInfo} from "../node_modules/pusher-websocket-iso-externals-web/net_info";
import WS from 'pusher-websocket-iso-externals-node/ws';

var Factory = {

  createXHR() : Ajax {
    if (XHR){
      return this.createXMLHttpRequest();
    } else {
      return this.createMicrosoftXHR();
    }
  },

  createXMLHttpRequest() : Ajax {
    return new XHR();
  },

  createMicrosoftXHR() : Ajax {
    return new ActiveXObject("Microsoft.XMLHTTP");
  },

  createChannels() : Channels {
    return new Channels();
  },

  createConnectionManager(key : string, options : any) : ConnectionManager {
    return new ConnectionManager(key, options);
  },

  createChannel(name: string, pusher: any) : Channel {
    return new Channel(name, pusher);
  },

  createPrivateChannel(name: string, pusher: any) : PrivateChannel {
    return new PrivateChannel(name, pusher);
  },

  createPresenceChannel(name: string, pusher: any) : PresenceChannel {
    return new PresenceChannel(name, pusher);
  },

  createTimelineSender(timeline : Timeline, options : any) {
    return new TimelineSender(timeline, options);
  },

  createAuthorizer(channel : Channel, options : any) : Authorizer {
    return new Authorizer(channel, options);
  },

  /* RETRIEVE APIS */
  getNetwork() : NetInfo {
    return Network;
  },

  newWebSocket(url : string) : any {
    var Constructor = WS.getAPI();
    return new Constructor(url);
  }
  // getLocalStorage() : any {
  //   try {
  //     return window.localStorage;
  //   } catch (e) {
  //     return undefined;
  //   }
  // }
}

export default Factory;
