import Logger from '../../logger';
import TimelineSender from '../../timeline/timeline_sender'
import * as Collections from '../../utils/collections';
import Util from '../../util';
import Factory from '../../utils/factory';
import Runtime from 'runtime';
import TimelineTransport from 'shared/timeline_transport';

var xhr = function(sender : TimelineSender, encrypted : boolean) : TimelineTransport {
  return function(data : any, callback : Function) {
    var scheme = "http" + (encrypted ? "s" : "") + "://";
    var url = scheme + (sender.options.host) + sender.options.path + "/xhr";
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

export default xhr;
