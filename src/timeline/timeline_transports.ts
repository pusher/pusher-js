import JSONPRequest from '../runtimes/dom/jsonp_request';
import {ScriptReceivers} from '../runtimes/dom/script_receiver_factory';
import Logger from '../logger';
import TimelineSender from '../timeline/timeline_sender'
import * as Collections from '../utils/collections';
import Util from '../util';
import Factory from '../utils/factory';
import Runtime from '../runtimes/runtime';

interface TimelineTransport {
  (data : any, callback : Function) : void;
}

var jsonp = function(sender : TimelineSender, encrypted : boolean): TimelineTransport {
  return function(data : any, callback : Function) {
    var scheme = "http" + (encrypted ? "s" : "") + "://";
    var url = scheme + (sender.host || sender.options.host) + sender.options.path + "/jsonp";
    var request = Factory.createJSONPRequest(url, data);

    var receiver = Runtime.ScriptReceivers.create(function(error, result){
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

export {TimelineTransport, jsonp, xhr};
