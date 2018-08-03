import TimelineSender from "core/timeline/timeline_sender";

interface TimelineTransport {
  name: string;
  getAgent:(sender: TimelineSender, useTLS : boolean)=>(data : any, callback : Function) => void;
}

export default TimelineTransport;
