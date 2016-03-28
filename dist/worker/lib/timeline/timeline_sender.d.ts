import Timeline from "./timeline";
export default class TimelineSender {
    timeline: Timeline;
    options: any;
    host: string;
    constructor(timeline: Timeline, options: any);
    send(encrypted: boolean, callback?: Function): void;
}
