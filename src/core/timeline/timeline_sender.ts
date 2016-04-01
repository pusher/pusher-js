import * as Collections from "../utils/collections";
import Util from "../util";
import base64encode from "../base64";
import Timeline from "./timeline";
import Runtime from 'runtime';

export default class TimelineSender {
  timeline: Timeline;
  options : any;
  host: string;

  constructor(timeline: Timeline, options : any) {
    this.timeline = timeline;
    this.options = options || {};
  }

  send(encrypted : boolean, callback?: Function) {
    var self = this;

    if (self.timeline.isEmpty()) {
      return;
    }

    self.timeline.send(Runtime.TimelineTransport.getAgent(this, encrypted), callback);
  }
}
