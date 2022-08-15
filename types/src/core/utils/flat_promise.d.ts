declare function flatPromise(): {
    promise: Promise<unknown>;
    resolve: any;
    reject: any;
};
export default flatPromise;
