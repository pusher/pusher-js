import Logger from 'core/logger';
import TimelineSender from 'core/timeline/timeline_sender';
import * as Collections from 'core/utils/collections';
import Util from 'core/util';
import Runtime from 'runtime';
import TimelineTransport from 'core/timeline/timeline_transport';

var getAgent = function(sender: TimelineSender, useTLS: boolean) {
  return function(data: any, callback: Function) {
    var scheme = 'http' + (useTLS ? 's' : '') + '://';
    var url =
      scheme + (sender.host || sender.options.host) + sender.options.path;
    var query = Collections.buildQueryString(data);
    url += '/' + 2 + '?' + query;

    fetch(url)
      .then(response => {
        if (response.status !== 200) {
          throw `received ${response.status} from stats.pusher.com`;
        }
        return response.json();
      })
      .then(({ host }) => {
        if (host) {
          sender.host = host;
        }
      })
      .catch(err => {
        Logger.debug('TimelineSender Error: ', err);
      });
  };
};

var fetchTimeline = {
  name: 'xhr',
  getAgent
};

export default fetchTimeline;
