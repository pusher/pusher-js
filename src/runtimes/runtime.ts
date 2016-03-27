import Runtime from "./abstract_runtime";
import Browser from "./browser";
import Isomorphic from "./isomorphic";

function decide() : Runtime {
  if (typeof(window) !== 'undefined' && typeof((window).document) !== 'undefined') {
    return new Browser();
  } else {
    return new Isomorphic();
  }
}
export default decide();
