import Logger from 'core/logger';
import TimelineSender from 'core/timeline/timeline_sender'
import * as Collections from 'core/utils/collections';
import Util from 'core/util';
import Runtime from 'runtime';
import TimelineTransport from 'core/timeline/timeline_transport';

var getAgent = function(sender : TimelineSender, useTLS : boolean) {
  return function(data : any, callback : Function) {
    var scheme = "http" + (useTLS ? "s" : "") + "://";
    var url = scheme + (sender.host || sender.options.host) + sender.options.path;
    var query = Collections.buildQueryString(data);

    url += ("/" + 2 + "?" + query);

    var xhr = Runtime.createXHR();
    xhr.open("GET", url, true);

    xhr.onreadystatechange = function(){
      if (xhr.readyState === 4) {
        let {status, responseText} = xhr;
        if (status !== 200) {
          Logger.debug(`TimelineSender Error: received ${status} from stats.pusher.com`);
          if (callback) {
            callback(`Error: received ${status} from stats.pusher.com`, null)
          }
          return;
        }

        var result;
        try {
          var result = JSON.parse(responseText);
        } catch(e) {
          Logger.debug(`TimelineSenderError: invalid response ${responseText}`);
          return
        }

        if (result && result.host) {
          sender.host = result.host;
        }
        if (callback) {
          callback(null, result)
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
