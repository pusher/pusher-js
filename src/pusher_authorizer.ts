import Logger from './logger';
import Channel from './channels/channel';
import Factory from './utils/factory';
import Runtime from 'runtime';
import {AuthTransports} from 'shared/auth_transports';

export default class Authorizer {
  static authorizers : AuthTransports;

  channel: Channel;
  type: string;
  options: any;
  authOptions: any;

  constructor(channel : Channel, options : any) {
    this.channel = channel;
    this.type = options.authTransport;
    this.options = options;
    this.authOptions = (options || {}).auth || {}
  }

  composeQuery(socketId : string) : string {
    var query = 'socket_id=' + encodeURIComponent(socketId) +
      '&channel_name=' + encodeURIComponent(this.channel.name);

    for(var i in this.authOptions.params) {
      query += "&" + encodeURIComponent(i) + "=" + encodeURIComponent(this.authOptions.params[i]);
    }

    return query;
  }

  authorize(socketId : string, callback : Function) : any {
    Authorizer.authorizers = Authorizer.authorizers || Runtime.getAuthorizers();
    return Authorizer.authorizers[this.type].call(this, Runtime, socketId, callback);
  }
}
