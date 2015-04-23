/* */ 
var _ = require("./utils"),
    maker = require("./joins").instanceJoinCreator;
var mapChildListenables = function(listenable) {
  var i = 0,
      children = {},
      childName;
  for (; i < (listenable.children || []).length; ++i) {
    childName = listenable.children[i];
    if (listenable[childName]) {
      children[childName] = listenable[childName];
    }
  }
  return children;
};
var flattenListenables = function(listenables) {
  var flattened = {};
  for (var key in listenables) {
    var listenable = listenables[key];
    var childMap = mapChildListenables(listenable);
    var children = flattenListenables(childMap);
    flattened[key] = listenable;
    for (var childKey in children) {
      var childListenable = children[childKey];
      flattened[key + _.capitalize(childKey)] = childListenable;
    }
  }
  return flattened;
};
module.exports = {
  hasListener: function(listenable) {
    var i = 0,
        j,
        listener,
        listenables;
    for (; i < (this.subscriptions || []).length; ++i) {
      listenables = [].concat(this.subscriptions[i].listenable);
      for (j = 0; j < listenables.length; j++) {
        listener = listenables[j];
        if (listener === listenable || listener.hasListener && listener.hasListener(listenable)) {
          return true;
        }
      }
    }
    return false;
  },
  listenToMany: function(listenables) {
    var allListenables = flattenListenables(listenables);
    for (var key in allListenables) {
      var cbname = _.callbackName(key),
          localname = this[cbname] ? cbname : this[key] ? key : undefined;
      if (localname) {
        this.listenTo(allListenables[key], localname, this[cbname + "Default"] || this[localname + "Default"] || localname);
      }
    }
  },
  validateListening: function(listenable) {
    if (listenable === this) {
      return "Listener is not able to listen to itself";
    }
    if (!_.isFunction(listenable.listen)) {
      return listenable + " is missing a listen method";
    }
    if (listenable.hasListener && listenable.hasListener(this)) {
      return "Listener cannot listen to this listenable because of circular loop";
    }
  },
  listenTo: function(listenable, callback, defaultCallback) {
    var desub,
        unsubscriber,
        subscriptionobj,
        subs = this.subscriptions = this.subscriptions || [];
    _.throwIf(this.validateListening(listenable));
    this.fetchInitialState(listenable, defaultCallback);
    desub = listenable.listen(this[callback] || callback, this);
    unsubscriber = function() {
      var index = subs.indexOf(subscriptionobj);
      _.throwIf(index === -1, 'Tried to remove listen already gone from subscriptions list!');
      subs.splice(index, 1);
      desub();
    };
    subscriptionobj = {
      stop: unsubscriber,
      listenable: listenable
    };
    subs.push(subscriptionobj);
    return subscriptionobj;
  },
  stopListeningTo: function(listenable) {
    var sub,
        i = 0,
        subs = this.subscriptions || [];
    for (; i < subs.length; i++) {
      sub = subs[i];
      if (sub.listenable === listenable) {
        sub.stop();
        _.throwIf(subs.indexOf(sub) !== -1, 'Failed to remove listen from subscriptions list!');
        return true;
      }
    }
    return false;
  },
  stopListeningToAll: function() {
    var remaining,
        subs = this.subscriptions || [];
    while ((remaining = subs.length)) {
      subs[0].stop();
      _.throwIf(subs.length !== remaining - 1, 'Failed to remove listen from subscriptions list!');
    }
  },
  fetchInitialState: function(listenable, defaultCallback) {
    defaultCallback = (defaultCallback && this[defaultCallback]) || defaultCallback;
    var me = this;
    if (_.isFunction(defaultCallback) && _.isFunction(listenable.getInitialState)) {
      var data = listenable.getInitialState();
      if (data && _.isFunction(data.then)) {
        data.then(function() {
          defaultCallback.apply(me, arguments);
        });
      } else {
        defaultCallback.call(this, data);
      }
    }
  },
  joinTrailing: maker("last"),
  joinLeading: maker("first"),
  joinConcat: maker("all"),
  joinStrict: maker("strict")
};
