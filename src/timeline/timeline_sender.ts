import * as Collections from "../utils/collections";
import * as Util from "../util";
import base64encode from "../base64";
import Timeline from "./timeline";

export default class TimelineSender {
  timeline: Timeline;
  options : any;

  constructor(timeline: Timeline, options : any) {
    this.timeline = timeline;
    this.options = options || {};
  }

  send(encrypted : boolean, callback?: Function) {
    var self = this;

    if (self.timeline.isEmpty()) {
      return;
    }

    var sendXHR = function(data, callback) {
      var scheme = "http" + (encrypted ? "s" : "") + "://";
      var url = scheme + (self.options.host) + self.options.path;
      var params = Collections.filterObject(data, function(value) {
        return value !== undefined;
      });

      var query = Collections.map(
        Collections.flatten(encodeParamsObject(params)),
        Util.method("join", "=")
      ).join("&");

      url += ("/" + 2 + "?" + query); // TODO: check what to do in lieu of receiver number

      var xhr = Util.createXHR();
      xhr.open("GET", url, true);

      xhr.onreadystatechange = function(){
        if (xhr.readyState === 4) {
          // TODO: handle response
        }
      }

      xhr.send()
    };
    self.timeline.send(sendXHR, callback);
  }
}

function encodeParamsObject(data : any) : string {
  return Collections.mapObject(data, function(value) {
    if (typeof value === "object") {
      value = JSON.stringify(value);
    }
    return encodeURIComponent(base64encode(value.toString()));
  });
}
