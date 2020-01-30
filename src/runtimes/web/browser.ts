import AbstractRuntime from 'runtimes/interface';
import { ScriptReceiverFactory } from './dom/script_receiver_factory';
import ScriptRequest from './dom/script_request';
import JSONPRequest from './dom/jsonp_request';
import Ajax from 'core/http/ajax';

interface Browser extends AbstractRuntime {
  // for jsonp auth
  nextAuthCallbackID: number;
  auth_callbacks: any;
  ScriptReceivers: ScriptReceiverFactory;
  DependenciesReceivers: ScriptReceiverFactory;
  onDocumentBody(callback: Function);
  getDocument(): any;

  createJSONPRequest(url: string, data: any): JSONPRequest;
  createScriptRequest(src: string): ScriptRequest;

  isXDRSupported(useTLS?: boolean): boolean;
  createXMLHttpRequest(): Ajax;
  createMicrosoftXHR(): Ajax;
}

export default Browser;
