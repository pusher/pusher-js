import TimelineSender from 'core/timeline/timeline_sender';
import TimelineTransport from 'core/timeline/timeline_transport';
import Browser from 'runtime';
import {AuthTransport} from 'core/auth/auth_transports';
import {ScriptReceivers} from '../dom/script_receiver_factory';

var getAgent = function(sender : TimelineSender, useTLS : boolean) {
  return function(data : any, callback : Function) {
    var scheme = "http" + (useTLS ? "s" : "") + "://";
    var url = scheme + (sender.host || sender.options.host) + sender.options.path;
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

var jsonp = {
  name: 'jsonp',
  getAgent
}

export default jsonp;
