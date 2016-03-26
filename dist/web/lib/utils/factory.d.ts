import Authorizer from "../pusher_authorizer";
import Timeline from "../timeline/timeline";
import TimelineSender from "../timeline/timeline_sender";
import PresenceChannel from "../channels/presence_channel";
import PrivateChannel from "../channels/private_channel";
import Channel from "../channels/channel";
import ConnectionManager from "../connection/connection_manager";
import Ajax from "../http/ajax";
import Channels from "../channels/channels";
export default class Factory {
    createXHR(): Ajax;
    createXMLHttpRequest(): Ajax;
    createMicrosoftXHR(): Ajax;
    createChannels(): Channels;
    createConnectionManager(key: string, options: any): ConnectionManager;
    createChannel(name: string, pusher: any): Channel;
    createPrivateChannel(name: string, pusher: any): PrivateChannel;
    createPresenceChannel(name: string, pusher: any): PresenceChannel;
    createTimelineSender(timeline: Timeline, options: any): TimelineSender;
    createAuthorizer(channel: Channel, options: any): Authorizer;
}
