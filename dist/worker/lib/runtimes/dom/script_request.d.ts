import ScriptReceiver from './script_receiver';
export default class ScriptRequest {
    src: string;
    script: any;
    errorScript: any;
    constructor(src: string);
    send(receiver: ScriptReceiver): void;
    cleanup(): void;
}
