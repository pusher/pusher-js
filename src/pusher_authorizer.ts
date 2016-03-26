import Logger from './logger';
import Channel from './channels/channel';
import Factory from './utils/factory';

var authorizers = {
  ajax: function(socketId, callback){
    var self = this, xhr;

    xhr = Factory.createXHR();
    xhr.open("POST", self.options.authEndpoint, true);

    // add request headers
    xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
    for(var headerName in this.authOptions.headers) {
      xhr.setRequestHeader(headerName, this.authOptions.headers[headerName]);
    }

    xhr.onreadystatechange = function() {
      if (xhr.readyState === 4) {
        if (xhr.status === 200) {
          var data, parsed = false;

          try {
            data = JSON.parse(xhr.responseText);
            parsed = true;
          } catch (e) {
            callback(true, 'JSON returned from webapp was invalid, yet status code was 200. Data was: ' + xhr.responseText);
          }

          if (parsed) { // prevents double execution.
            callback(false, data);
          }
        } else {
          Logger.warn("Couldn't get auth info from your webapp", xhr.status);
          callback(true, xhr.status);
        }
      }
    };

    xhr.send(this.composeQuery(socketId));
    return xhr;
  }
};

export default class Authorizer {

  static authorizers = authorizers;

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
    return Authorizer.authorizers[this.type].call(this, socketId, callback);
  }
}
