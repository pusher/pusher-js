import TransportHooks from './transport_hooks';
import TransportConnection from './transport_connection';
export default class Transport {
    hooks: TransportHooks;
    constructor(hooks: TransportHooks);
    isSupported(environment: any): boolean;
    createConnection(name: string, priority: number, key: string, options: any): TransportConnection;
}
