import URLLocation from "./url_location";
interface SocketHooks {
    getReceiveURL(url: URLLocation, session: string): string;
    onHeartbeat(Socket: any): void;
    sendHeartbeat(Socket: any): void;
    onFinished(Socket: any, number: any): void;
}
export default SocketHooks;
