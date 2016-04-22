import Logger from 'core/logger';
import TimelineSender from 'core/timeline/timeline_sender'
import * as Collections from 'core/utils/collections';
import Util from 'core/util';
import Runtime from 'runtime';
import TimelineTransport from 'core/timeline/timeline_transport';

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

    fetch(url).
    then((response) => {
      if (response.status !== 200) {
        Logger.debug("TimelineSender Error: received from stats.pusher.com")
      }
    }).catch((err)=> {
      Logger.debug("TimelineSender Error:", err);
    });
  }
}

var fetchTimeline = {
  name: 'xhr',
  getAgent
}

export default fetchTimeline;
