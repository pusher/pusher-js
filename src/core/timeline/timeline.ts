import * as Collections from "../utils/collections";
import Util from "../util";
import {default as Level} from "./level";

export interface TimelineOptions {
  level?: Level;
  limit?: number;
  version?: string;
  cluster?: string;
  features?: string[];
  params?: any;
}

export default class Timeline {
  key: string;
  session: number;
  events: any[];
  options: TimelineOptions;
  sent: number;
  uniqueID: number;

  constructor(key : string, session : number, options : TimelineOptions) {
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

  send(sendfn, callback) {
    var data = Collections.extend({
      session: this.session,
      bundle: this.sent + 1,
      key: this.key,
      lib: "js",
      version: this.options.version,
      cluster: this.options.cluster,
      features: this.options.features,
      timeline: this.events
    }, this.options.params);

    this.events = [];
    sendfn(data, (error, result)=> {
      if (!error) {
        this.sent++;
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
