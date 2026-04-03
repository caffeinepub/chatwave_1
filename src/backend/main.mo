import Text "mo:core/Text";
import Nat "mo:core/Nat";
import Time "mo:core/Time";
import Order "mo:core/Order";
import Principal "mo:core/Principal";
import Iter "mo:core/Iter";
import Array "mo:core/Array";
import Runtime "mo:core/Runtime";
import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";
import Set "mo:core/Set";
import Map "mo:core/Map";
import MixinStorage "blob-storage/Mixin";
import Storage "blob-storage/Storage";

actor {
  include MixinStorage();

  // Types
  type Profile = {
    displayName : Text;
    avatarUrl : Storage.ExternalBlob;
    bio : Text;
    lastSeen : Int;
    blockedUsers : [Principal];
  };

  type Message = {
    sender : Principal;
    receiver : Principal;
    content : Text;
    mediaUrl : Storage.ExternalBlob;
    timestamp : Int;
    seen : Bool;
    deleted : Bool;
  };

  type CallRecord = {
    caller : Principal;
    callee : Principal;
    callType : { #voice; #video };
    duration : Nat;
    missed : Bool;
    timestamp : Int;
  };

  module CallRecord {
    public func compare(record1 : CallRecord, record2 : CallRecord) : Order.Order {
      Nat.compare(record1.duration, record2.duration);
    };
  };

  module Profile {
    public func compareByDisplayName(profile1 : Profile, profile2 : Profile) : Order.Order {
      Text.compare(profile1.displayName, profile2.displayName);
    };
  };

  // Authorization setup
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  // Persistent data
  let profiles = Map.empty<Principal, Profile>();
  let messages = Map.empty<Nat, Message>();
  let callHistory = Map.empty<Nat, CallRecord>();
  var messageId = 0;
  var callId = 0;

  // Public query functions
  public query ({ caller }) func getProfile(user : Principal) : async Profile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view profiles");
    };
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    switch (profiles.get(user)) {
      case (null) { Runtime.trap("Profile not found") };
      case (?profile) { profile };
    };
  };

  public query ({ caller }) func getOwnProfile() : async Profile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view profiles");
    };
    switch (profiles.get(caller)) {
      case (null) { Runtime.trap("Profile not found") };
      case (?profile) { profile };
    };
  };

  public query ({ caller }) func getAllProfiles() : async [Profile] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view all profiles");
    };
    profiles.values().toArray();
  };

  public query ({ caller }) func getMessagesWith(user : Principal) : async [Message] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view messages");
    };
    let userMessages = messages.values().toArray().filter(
      func(m) {
        (m.sender == caller and m.receiver == user) or (m.sender == user and m.receiver == caller)
      }
    );
    userMessages;
  };

  public query ({ caller }) func getCallHistory() : async [CallRecord] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view call history");
    };
    let calls = callHistory.values().toArray().filter(
      func(c) { c.caller == caller or c.callee == caller }
    );
    calls;
  };

  // Public update functions
  public shared ({ caller }) func registerOrUpdateProfile(displayName : Text, avatarUrl : Storage.ExternalBlob, bio : Text) : async Profile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can register or update profiles");
    };
    let newProfile : Profile = {
      displayName;
      avatarUrl;
      bio;
      lastSeen = Time.now();
      blockedUsers = [];
    };
    profiles.add(caller, newProfile);
    newProfile;
  };

  public shared ({ caller }) func sendMessage(receiver : Principal, content : Text, mediaUrl : Storage.ExternalBlob) : async Message {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can send messages");
    };
    if (caller == receiver) { Runtime.trap("Cannot send message to yourself") };
    let msg : Message = {
      sender = caller;
      receiver;
      content;
      mediaUrl;
      timestamp = Time.now();
      seen = false;
      deleted = false;
    };
    messages.add(messageId, msg);
    messageId += 1;
    msg;
  };

  public shared ({ caller }) func markMessageSeen(msgId : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can mark messages as seen");
    };
    switch (messages.get(msgId)) {
      case (null) { Runtime.trap("Message not found") };
      case (?msg) {
        if (msg.receiver != caller) { Runtime.trap("Not authorized to mark this message") };
        let updatedMsg = {
          sender = msg.sender;
          receiver = msg.receiver;
          content = msg.content;
          mediaUrl = msg.mediaUrl;
          timestamp = msg.timestamp;
          seen = true;
          deleted = msg.deleted;
        };
        messages.add(msgId, updatedMsg);
      };
    };
  };

  public shared ({ caller }) func deleteMessage(msgId : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can delete messages");
    };
    switch (messages.get(msgId)) {
      case (null) { Runtime.trap("Message not found") };
      case (?msg) {
        if (msg.sender != caller) { Runtime.trap("Not authorized to delete this message") };
        let updatedMsg = {
          sender = msg.sender;
          receiver = msg.receiver;
          content = msg.content;
          mediaUrl = msg.mediaUrl;
          timestamp = msg.timestamp;
          seen = msg.seen;
          deleted = true;
        };
        messages.add(msgId, updatedMsg);
      };
    };
  };

  public shared ({ caller }) func logCall(callee : Principal, callType : { #voice; #video }, duration : Nat, missed : Bool) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can log calls");
    };
    if (caller == callee) { Runtime.trap("Cannot call yourself") };
    let call : CallRecord = {
      caller = caller;
      callee;
      callType;
      duration;
      missed;
      timestamp = Time.now();
    };
    callHistory.add(callId, call);
    callId += 1;
  };

  public shared ({ caller }) func blockUser(userToBlock : Principal) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can block others");
    };
    if (caller == userToBlock) { Runtime.trap("Cannot block yourself") };
    switch (profiles.get(caller)) {
      case (null) { Runtime.trap("Profile not found") };
      case (?profile) {
        let blockedSet = profile.blockedUsers.concat([userToBlock]);
        let updatedProfile = {
          displayName = profile.displayName;
          avatarUrl = profile.avatarUrl;
          bio = profile.bio;
          lastSeen = profile.lastSeen;
          blockedUsers = blockedSet;
        };
        profiles.add(caller, updatedProfile);
      };
    };
  };

  public shared ({ caller }) func unblockUser(userToUnblock : Principal) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can unblock others");
    };
    switch (profiles.get(caller)) {
      case (null) { Runtime.trap("Profile not found") };
      case (?profile) {
        let unblockedSet = profile.blockedUsers.filter(
          func(p) { p != userToUnblock }
        );
        let updatedProfile = {
          displayName = profile.displayName;
          avatarUrl = profile.avatarUrl;
          bio = profile.bio;
          lastSeen = profile.lastSeen;
          blockedUsers = unblockedSet;
        };
        profiles.add(caller, updatedProfile);
      };
    };
  };

  // Required frontend interface functions
  public query ({ caller }) func getCallerUserProfile() : async ?Profile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view profiles");
    };
    profiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?Profile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view profiles");
    };
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    profiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : Profile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    profiles.add(caller, profile);
  };
};
