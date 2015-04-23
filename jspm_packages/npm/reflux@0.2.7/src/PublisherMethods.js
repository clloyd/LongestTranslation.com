/* */ 
var _ = require("./utils");
module.exports = {
  preEmit: function() {},
  shouldEmit: function() {
    return true;
  },
  listen: function(callback, bindContext) {
    bindContext = bindContext || this;
    var eventHandler = function(args) {
      if (aborted) {
        return ;
      }
      callback.apply(bindContext, args);
    },
        me = this,
        aborted = false;
    this.emitter.addListener(this.eventLabel, eventHandler);
    return function() {
      aborted = true;
      me.emitter.removeListener(me.eventLabel, eventHandler);
    };
  },
  promise: function(promise) {
    var me = this;
    var canHandlePromise = this.children.indexOf('completed') >= 0 && this.children.indexOf('failed') >= 0;
    if (!canHandlePromise) {
      throw new Error('Publisher must have "completed" and "failed" child publishers');
    }
    promise.then(function(response) {
      return me.completed(response);
    }, function(error) {
      return me.failed(error);
    });
  },
  listenAndPromise: function(callback, bindContext) {
    var me = this;
    bindContext = bindContext || this;
    this.willCallPromise = (this.willCallPromise || 0) + 1;
    var removeListen = this.listen(function() {
      if (!callback) {
        throw new Error('Expected a function returning a promise but got ' + callback);
      }
      var args = arguments,
          promise = callback.apply(bindContext, args);
      return me.promise.call(me, promise);
    }, bindContext);
    return function() {
      me.willCallPromise--;
      removeListen.call(me);
    };
  },
  trigger: function() {
    var args = arguments,
        pre = this.preEmit.apply(this, args);
    args = pre === undefined ? args : _.isArguments(pre) ? pre : [].concat(pre);
    if (this.shouldEmit.apply(this, args)) {
      this.emitter.emit(this.eventLabel, args);
    }
  },
  triggerAsync: function() {
    var args = arguments,
        me = this;
    _.nextTick(function() {
      me.trigger.apply(me, args);
    });
  },
  triggerPromise: function() {
    var me = this;
    var args = arguments;
    var canHandlePromise = this.children.indexOf('completed') >= 0 && this.children.indexOf('failed') >= 0;
    var promise = _.createPromise(function(resolve, reject) {
      if (me.willCallPromise) {
        _.nextTick(function() {
          var old_promise_method = me.promise;
          me.promise = function(promise) {
            promise.then(resolve, reject);
            me.promise = old_promise_method;
            return me.promise.apply(me, arguments);
          };
          me.trigger.apply(me, args);
        });
        return ;
      }
      if (canHandlePromise) {
        var removeSuccess = me.completed.listen(function(args) {
          removeSuccess();
          removeFailed();
          resolve(args);
        });
        var removeFailed = me.failed.listen(function(args) {
          removeSuccess();
          removeFailed();
          reject(args);
        });
      }
      me.triggerAsync.apply(me, args);
      if (!canHandlePromise) {
        resolve();
      }
    });
    return promise;
  }
};
