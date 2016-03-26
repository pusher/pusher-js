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

export default class Factory {

  createXHR() : Ajax {
    if (XHR){
      return this.createXMLHttpRequest();
    } else {
      return this.createMicrosoftXHR();
    }
  }

  createXMLHttpRequest() : Ajax {
    return new XHR();
  }

  createMicrosoftXHR() : Ajax {
    return new ActiveXObject("Microsoft.XMLHTTP");
  }

  createChannels() : Channels {
    return new Channels(this);
  }

  createConnectionManager(key : string, options : any) : ConnectionManager {
    return new ConnectionManager(key, options);
  }

  createChannel(name: string, pusher: any) : Channel {
    return new Channel(this, name, pusher);
  }

  createPrivateChannel(name: string, pusher: any) : PrivateChannel {
    return new PrivateChannel(this, name, pusher);
  }

  createPresenceChannel(name: string, pusher: any) : PresenceChannel {
    return new PresenceChannel(this, name, pusher);
  }

  createTimelineSender(timeline : Timeline, options : any) {
    return new TimelineSender(this, timeline, options);
  }

  createAuthorizer(channel : Channel, options : any) : Authorizer {
    return new Authorizer(this, channel, options);
  }

}
