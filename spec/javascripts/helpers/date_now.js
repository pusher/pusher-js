Pusher.Util.now = function() {
  if (Date.now === undefined) {
    return new Date().valueOf();
  } else {
    return Date.now();
  }
};
