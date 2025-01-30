import { default as NativeNetInfo } from '@react-native-community/netinfo';
import EventsDispatcher from 'core/events/dispatcher';
import Util from 'core/util';
import Reachability from 'core/reachability';

function hasOnlineConnectionState(connectionState): boolean {
  return connectionState.type.toLowerCase() !== 'none';
}

export class NetInfo extends EventsDispatcher implements Reachability {
  online: boolean;

  constructor() {
    super();
    this.online = true;

    NativeNetInfo.fetch().then((connectionState) => {
      this.online = hasOnlineConnectionState(connectionState);
    });

    NativeNetInfo.addEventListener((connectionState) => {
      var isNowOnline = hasOnlineConnectionState(connectionState);

      // React Native counts the switch from Wi-Fi to Cellular
      // as a state change. Return if current and previous states
      // are both online/offline
      if (this.online === isNowOnline) return;
      this.online = isNowOnline;
      if (this.online) {
        this.emit('online');
      } else {
        this.emit('offline');
      }
    });
  }

  isOnline(): boolean {
    return this.online;
  }
}

export var Network = new NetInfo();
