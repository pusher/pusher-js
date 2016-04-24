import TimelineSender from '../timeline/timeline_sender';
interface TimelineTransport {
    (data: any, callback: Function): void;
}
declare var jsonp: (sender: TimelineSender, encrypted: boolean) => TimelineTransport;
declare var xhr: (sender: TimelineSender, encrypted: boolean) => TimelineTransport;
export { TimelineTransport, jsonp, xhr };
