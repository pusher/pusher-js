import Logger from 'core/logger';
import TimelineSender from 'core/timeline/timeline_sender'
import * as Collections from 'core/utils/collections';
import Util from 'core/util';
import Factory from 'core/utils/factory';
import TimelineTransport from 'shared/timeline/timeline_transport';

var getAgent = function(sender : TimelineSender, encrypted : boolean) {
  return function(data : any, callback : Function) {
    var scheme = "http" + (encrypted ? "s" : "") + "://";
    var url = scheme + (sender.options.host) + sender.options.path;
    var params = Collections.filterObject(data, function(value) {
      return value !== undefined;
    });

    var query = Collections.map(
      Collections.flatten(Collections.encodeParamsObject(params)),
      Util.method("join", "=")
    ).join("&");

    url += ("/" + 2 + "?" + query);

    var xhr = Factory.createXHR();
    xhr.open("GET", url, true);

    xhr.onreadystatechange = function(){
      if (xhr.readyState === 4) {
        // The reason for not checking the status is that XDomainRequests
        // do not allow access to status code
        if (xhr.responseText !== "OK") {
          Logger.debug("TimelineSender Error: received from stats.pusher.com")
        }
      }
    }

    xhr.send();
  }
};

var xhr = {
  name: 'xhr',
  getAgent
}

export default xhr;
