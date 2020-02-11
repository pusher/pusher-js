import ScriptReceiver from './script_receiver';
import ScriptRequest from './script_request';
export default class JSONPRequest {
    url: string;
    data: any;
    request: ScriptRequest;
    constructor(url: string, data: any);
    send(receiver: ScriptReceiver): void;
    cleanup(): void;
}
