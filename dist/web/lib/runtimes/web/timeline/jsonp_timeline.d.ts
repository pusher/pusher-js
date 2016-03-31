import TimelineSender from 'core/timeline/timeline_sender';
import TimelineTransport from 'shared/timeline/timeline_transport';
declare var jsonp: (sender: TimelineSender, encrypted: boolean) => TimelineTransport;
export default jsonp;
