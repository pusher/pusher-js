import TimelineSender from 'core/timeline/timeline_sender';
import TimelineTransport from 'shared/timeline/timeline_transport';
import Browser from 'runtime';
import {AuthTransport} from 'shared/auth/auth_transports';
import {ScriptReceivers} from '../dom/script_receiver_factory';

var jsonp = function(sender : TimelineSender, encrypted : boolean): TimelineTransport {
  return function(data : any, callback : Function) {
    var scheme = "http" + (encrypted ? "s" : "") + "://";
    var url = scheme + (sender.host || sender.options.host) + sender.options.path + "/jsonp";
    var request = Browser.createJSONPRequest(url, data);

    var receiver = Browser.ScriptReceivers.create(function(error, result){
      ScriptReceivers.remove(receiver);
      request.cleanup();

      if (result && result.host) {
        sender.host = result.host;
      }
      if (callback) {
        callback(error, result);
      }
    });
    request.send(receiver);
  }
};

export default jsonp;
