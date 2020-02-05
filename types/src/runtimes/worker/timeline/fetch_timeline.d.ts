import TimelineSender from 'core/timeline/timeline_sender';
declare var fetchTimeline: {
    name: string;
    getAgent: (sender: TimelineSender, useTLS: boolean) => (data: any, callback: Function) => void;
};
export default fetchTimeline;
