import {default as EventsDispatcher} from './events/dispatcher';

interface Reachability extends EventsDispatcher {
  isOnline(): boolean;
}

export default Reachability;
