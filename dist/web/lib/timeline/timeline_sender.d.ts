import Timeline from "./timeline";
export default class TimelineSender {
    timeline: Timeline;
    options: any;
    constructor(timeline: Timeline, options: any);
    send(encrypted: boolean, callback?: Function): void;
}
