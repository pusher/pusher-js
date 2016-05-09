import TimelineSender from "core/timeline/timeline_sender";

interface TimelineTransport {
  name: string;
  getAgent:(sender: TimelineSender, encrypted : boolean)=>(data : any, callback : Function) => void;
}

export default TimelineTransport;
