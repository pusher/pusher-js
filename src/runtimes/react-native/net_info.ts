import { NetInfo as NativeNetInfo } from "react-native";
import EventsDispatcher from "core/events/dispatcher";
import Reachability from "core/reachability";

export class NetInfo extends EventsDispatcher implements Reachability {
  online: boolean;

  constructor() {
    super();
    this.online = true;

    NativeNetInfo.isConnected.fetch().done(isConnected => {
      this.online = isConnected;
    });
    NativeNetInfo.isConnected.addEventListener(
      "connectionChange",
      this.handleConnectionChange
    );
  }

  handleConnectionChange = isConnected => {
    var isNowOnline = isConnected;

    // React Native counts the switch from Wi-Fi to Cellular
    // as a state change. Return if current and previous states
    // are both online/offline
    if (this.online !== isNowOnline) {
      this.online = isNowOnline;
      if (this.online) {
        this.emit("online");
      } else {
        this.emit("offline");
      }
    }
    NativeNetInfo.isConnected.removeEventListener(
      "connectionChange",
      this.handleConnectionChange
    );
  };

  isOnline(): boolean {
    return this.online;
  }
}

export var Network = new NetInfo();
