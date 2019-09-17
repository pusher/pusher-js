import Pusher from '../../../src/core/pusher';
import {ScriptReceiverFactory} from '../../../src/runtimes/web/dom/script_receiver_factory';

export default class PusherIntegration extends Pusher {

  static Integration : any = {
    ScriptReceivers: new ScriptReceiverFactory(
      "_pusher_integration_script_receivers",
      "Pusher.Integration.ScriptReceivers"
    )}

}
