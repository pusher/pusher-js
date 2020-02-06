import Socket from '../socket';
import URLLocation from './url_location';

interface SocketHooks {
  getReceiveURL(url: URLLocation, session: string): string;
  onHeartbeat(Socket): void;
  sendHeartbeat(Socket): void;
  onFinished(Socket, Status): void;
}

export default SocketHooks;
