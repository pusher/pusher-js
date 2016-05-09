import Pusher from 'core/pusher';
import {ScriptReceiverFactory} from 'dom/script_receiver_factory';

class PusherIntegration extends Pusher {

  static Integration : any = {
    ScriptReceivers: new ScriptReceiverFactory(
      "_pusher_integration_script_receivers",
      "Pusher.Integration.ScriptReceivers"
    )}

}

module.exports = PusherIntegration;
