;(function() {
  var Pusher = this.Pusher;

  /*-----------------------------------------------
    Helpers:
  -----------------------------------------------*/

  function capitalize(str) {
    return str.substr(0, 1).toUpperCase() + str.substr(1);
  }


  function safeCall(method, obj, data) {
    if (obj[method] !== undefined) {
      obj[method](data);
    }
  }

  /*-----------------------------------------------
    The State Machine
  -----------------------------------------------*/
  function Machine(actor, initialState, transitions, stateActions) {
    this.actor = actor;
    this.state = undefined;
    this.errors = [];

    // functions for each state
    this.stateActions = stateActions;

    // set up the transitions
    this.transitions = transitions;

    this.transition(initialState);
  };

  // try and avoid transitioning with data - it's a fucking state machine
  Machine.prototype.transition = function(nextState, data) {
    var prevState = this.state;
    var stateCallbacks = this.stateActions;

    if (prevState && (this.transitions[prevState].indexOf(nextState) == -1)) {
      throw new Error(this.actor.key + ': Invalid transition [' + prevState + ' to ' + nextState + ']');
    }

    // exit
    safeCall(prevState + 'Exit', stateCallbacks, data);

    // tween
    safeCall(prevState + 'To' + capitalize(nextState), stateCallbacks, data);

    // pre
    safeCall(nextState + 'Pre', stateCallbacks, data);

    // change state:
    this.state = nextState;

    // handy to bind to
    this.actor.trigger('state_change', {
      oldState: prevState,
      newState: nextState
    });

    Pusher.debug('State changed', prevState + ' -> ' + nextState);

    // Post:
    safeCall(nextState + 'Post', stateCallbacks, data);
  };

  Machine.prototype.is = function(state) {
    return this.state === state;
  };

  Machine.prototype.isNot = function(state) {
    return this.state !== state;
  };

  this.Pusher.Machine = Machine;
}).call(this);
