export var addUnloadListener = function(listener) {
  if (window.addEventListener !== undefined) {
    window.addEventListener("unload", listener, false);
  } else if (window.attachEvent !== undefined) {
    window.attachEvent("onunload", listener);
  }
};

export var removeUnloadListener = function(listener) {
  if (window.addEventListener !== undefined) {
    window.removeEventListener("unload", listener, false);
  } else if (window.detachEvent !== undefined) {
    window.detachEvent("onunload", listener);
  }
};
