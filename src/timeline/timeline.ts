import * as Collections from "../utils/collections";
import Util from "../util";
import {default as Level} from "./level";

export default class Timeline {
  key: string;
  session: number;
  events: any[];
  options: any;
  sent: number;
  uniqueID: number;

  constructor(key : string, session : number, options : any) {
    this.key = key;
    this.session = session;
    this.events = [];
    this.options = options || {};
    this.sent = 0;
    this.uniqueID = 0;
  }

  log(level, event) {
    if (level <= this.options.level) {
      this.events.push(
        Collections.extend({}, event, { timestamp: Util.now() })
      );
      if (this.options.limit && this.events.length > this.options.limit) {
        this.events.shift();
      }
    }
  }

  error(event) {
    this.log(Level.ERROR, event);
  }

  info(event) {
    this.log(Level.INFO, event);
  }

  debug(event) {
    this.log(Level.DEBUG, event);
  }

  isEmpty() {
    return this.events.length === 0;
  }

  send(sendXHR, callback) {
    var self = this;

    var data = Collections.extend({
      session: self.session,
      bundle: self.sent + 1,
      key: self.key,
      lib: "js",
      version: self.options.version,
      cluster: self.options.cluster,
      features: self.options.features,
      timeline: self.events
    }, self.options.params);

    self.events = [];
    sendXHR(data, function(error, result) {
      if (!error) {
        self.sent++;
      }
      if (callback) {
        callback(error, result);
      }
    });

    return true;
  }

  generateUniqueID() : number {
    this.uniqueID++;
    return this.uniqueID;
  }
}
