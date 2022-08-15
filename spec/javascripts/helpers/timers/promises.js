
const setTimeoutPromise = (duration) => {
    return new Promise((resolve) => {
        setTimeout(resolve, duration);
    });
}
export default {
    setTimeout: setTimeoutPromise
};
