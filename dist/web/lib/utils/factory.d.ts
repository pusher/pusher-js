import Ajax from "../http/ajax";
export default class Factory {
    createXHR(): Ajax;
    createXMLHttpRequest(): Ajax;
    createMicrosoftXHR(): Ajax;
}
