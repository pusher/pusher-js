import TimelineSender from 'core/timeline/timeline_sender';
declare var jsonp: {
    name: string;
    getAgent: (sender: TimelineSender, encrypted: boolean) => (data: any, callback: Function) => void;
};
export default jsonp;
