import Factory from '../utils/factory';
import Timeline from "./timeline";
export default class TimelineSender {
    timeline: Timeline;
    options: any;
    constructor(factory: Factory, timeline: Timeline, options: any);
    send(encrypted: boolean, callback?: Function): void;
}
