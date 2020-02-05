import Ajax from './ajax';
interface RequestHooks {
    getRequest(HTTPRequest: any): Ajax;
    abortRequest(HTTPRequest: any): void;
}
export default RequestHooks;
