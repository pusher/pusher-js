import Logger from '../logger';
import Channel from '../channels/channel';
import Factory from '../utils/factory';
import Runtime from 'runtime';
import {AuthTransports} from './auth_transports';
import {AuthOptions} from './options';
import PusherOptions from '../options';

export default class Authorizer {
  static authorizers : AuthTransports;

  channel: Channel;
  type: string;
  options: PusherOptions;
  authOptions: AuthOptions;

  constructor(channel : Channel, options : PusherOptions) {
    this.channel = channel;

    let {authTransport} = options;

    if (typeof Runtime.getAuthorizers()[authTransport] === "undefined") {
      throw `'${authTransport}' is not a recognized auth transport`
    }

    this.type = authTransport;
    this.options = options;
    this.authOptions = (options || <any>{}).auth || {}
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
