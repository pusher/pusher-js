import {default as EventsDispatcher} from 'core/events/dispatcher'

export class NetInfo extends EventsDispatcher {

  isOnline() : boolean {
    return true;
  }

}

export var Network = new NetInfo();
