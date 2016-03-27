import JSONPRequest from '../runtimes/dom/jsonp_request';
import {ScriptReceivers} from '../runtimes/dom/script_receiver_factory';
import Logger from '../logger';
import TimelineSender from '../timeline/timeline_sender'
import * as Collections from '../utils/collections';
import Util from '../util';
import Factory from '../utils/factory';

interface TimelineTransport {
  (data : any, callback : Function) : void;
}

var jsonp = function(sender : TimelineSender, encrypted : boolean): TimelineTransport {
  return function(data : any, callback : Function) {
    var scheme = "http" + (encrypted ? "s" : "") + "://";
    var url = scheme + (sender.host || sender.options.host) + sender.options.path;
    var request = Factory.createJSONPRequest(url, data);

    var receiver = ScriptReceivers.create(function(error, result){
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

var xhr = function(sender : TimelineSender, encrypted : boolean) : TimelineTransport {
  return function(data : any, callback : Function) {
    Logger.warn('XHR timelines not yet supported');

    var scheme = "http" + (encrypted ? "s" : "") + "://";
    var url = scheme + (sender.options.host) + sender.options.path;
    var params = Collections.filterObject(data, function(value) {
      return value !== undefined;
    });

    var query = Collections.map(
      Collections.flatten(Collections.encodeParamsObject(params)),
      Util.method("join", "=")
    ).join("&");

    url += ("/" + 2 + "?" + query); // TODO: check what to do in lieu of receiver number

    var xhr = this.factory.createXHR();
    xhr.open("GET", url, true);

    xhr.onreadystatechange = function(){
      if (xhr.readyState === 4) {
        // TODO: handle response
      }
    }

    xhr.send()
  }
};

export {TimelineTransport, jsonp, xhr};
