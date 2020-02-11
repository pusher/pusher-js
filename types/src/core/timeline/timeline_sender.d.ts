import Timeline from './timeline';
export interface TimelineSenderOptions {
    host?: string;
    port?: number;
    path?: string;
}
export default class TimelineSender {
    timeline: Timeline;
    options: TimelineSenderOptions;
    host: string;
    constructor(timeline: Timeline, options: TimelineSenderOptions);
    send(useTLS: boolean, callback?: Function): void;
}
