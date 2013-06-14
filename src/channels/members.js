;(function() {
  /** Represents a collection of members of a presence channel. */
  function Members() {
    this.reset();
  }
  var prototype = Members.prototype;

  /** Returns member's info for given id.
   *
   * Resulting object containts two fields - id and info.
   *
   * @param {Number} id
   * @return {Object} member's info or null
   */
  prototype.get = function(id) {
    if (Object.prototype.hasOwnProperty.call(this.members, id)) {
      return {
        id: id,
        info: this.members[id]
      };
    } else {
      return null;
    }
  };

  /** Calls back for each member in unspecified order.
   *
   * @param  {Function} callback
   */
  prototype.each = function(callback) {
    var self = this;
    Pusher.Util.objectApply(self.members, function(member, id) {
      callback(self.get(id));
    });
  };

  /** Updates the id for connected member. For internal use only. */
  prototype.setMyID = function(id) {
    this.myID = id;
  };

  /** Handles subscription data. For internal use only. */
  prototype.onSubscription = function(subscriptionData) {
    this.members = subscriptionData.presence.hash;
    this.count = subscriptionData.presence.count;
    this.me = this.get(this.myID);
  };

  /** Adds a new member to the collection. For internal use only. */
  prototype.addMember = function(memberData) {
    if (this.get(memberData.user_id) === null) {
      this.count++;
    }
    this.members[memberData.user_id] = memberData.user_info;
    return this.get(memberData.user_id);
  };

  /** Adds a member from the collection. For internal use only. */
  prototype.removeMember = function(memberData) {
    var member = this.get(memberData.user_id);
    if (member) {
      delete this.members[memberData.user_id];
      this.count--;
    }
    return member;
  };

  /** Resets the collection to the initial state. For internal use only. */
  prototype.reset = function() {
    this.members = {};
    this.count = 0;
    this.myID = null;
    this.me = null;
  };

  Pusher.Members = Members;
}).call(this);
