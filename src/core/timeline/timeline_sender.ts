import * as Collections from '../utils/collections';
import Util from '../util';
import base64encode from '../base64';
import Timeline from './timeline';
import Runtime from 'runtime';

export interface TimelineSenderOptions {
  host?: string;
  port?: number;
  path?: string;
}

export default class TimelineSender {
  timeline: Timeline;
  options: TimelineSenderOptions;
  host: string;

  constructor(timeline: Timeline, options: TimelineSenderOptions) {
    this.timeline = timeline;
    this.options = options || {};
  }

  send(useTLS: boolean, callback?: Function) {
    if (this.timeline.isEmpty()) {
      return;
    }

    this.timeline.send(
      Runtime.TimelineTransport.getAgent(this, useTLS),
      callback
    );
  }
}
