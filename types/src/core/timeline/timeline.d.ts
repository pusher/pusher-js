import { default as Level } from './level';
export interface TimelineOptions {
    level?: Level;
    limit?: number;
    version?: string;
    cluster?: string;
    features?: string[];
    params?: any;
}
export default class Timeline {
    key: string;
    session: number;
    events: any[];
    options: TimelineOptions;
    sent: number;
    uniqueID: number;
    constructor(key: string, session: number, options: TimelineOptions);
    log(level: any, event: any): void;
    error(event: any): void;
    info(event: any): void;
    debug(event: any): void;
    isEmpty(): boolean;
    send(sendfn: any, callback: any): boolean;
    generateUniqueID(): number;
}
