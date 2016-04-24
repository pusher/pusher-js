import AbstractRuntime from "shared/abstract_runtime";
import { ScriptReceiverFactory } from './dom/script_receiver_factory';
interface Browser extends AbstractRuntime {
    nextAuthCallbackID: number;
    auth_callbacks: any[];
    ScriptReceivers: ScriptReceiverFactory;
    DependenciesReceivers: ScriptReceiverFactory;
}
export default Browser;
