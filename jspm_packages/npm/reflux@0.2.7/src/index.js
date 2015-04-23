/* */ 
exports.ActionMethods = require("./ActionMethods");
exports.ListenerMethods = require("./ListenerMethods");
exports.PublisherMethods = require("./PublisherMethods");
exports.StoreMethods = require("./StoreMethods");
exports.createAction = require("./createAction");
exports.createStore = require("./createStore");
exports.connect = require("./connect");
exports.connectFilter = require("./connectFilter");
exports.ListenerMixin = require("./ListenerMixin");
exports.listenTo = require("./listenTo");
exports.listenToMany = require("./listenToMany");
var maker = require("./joins").staticJoinCreator;
exports.joinTrailing = exports.all = maker("last");
exports.joinLeading = maker("first");
exports.joinStrict = maker("strict");
exports.joinConcat = maker("all");
var _ = require("./utils");
exports.EventEmitter = _.EventEmitter;
exports.Promise = _.Promise;
exports.createActions = function(definitions) {
  var actions = {};
  for (var k in definitions) {
    if (definitions.hasOwnProperty(k)) {
      var val = definitions[k],
          actionName = _.isObject(val) ? k : val;
      actions[actionName] = exports.createAction(val);
    }
  }
  return actions;
};
exports.setEventEmitter = function(ctx) {
  var _ = require("./utils");
  exports.EventEmitter = _.EventEmitter = ctx;
};
exports.setPromise = function(ctx) {
  var _ = require("./utils");
  exports.Promise = _.Promise = ctx;
};
exports.setPromiseFactory = function(factory) {
  var _ = require("./utils");
  _.createPromise = factory;
};
exports.nextTick = function(nextTick) {
  var _ = require("./utils");
  _.nextTick = nextTick;
};
exports.__keep = require("./Keep");
if (!Function.prototype.bind) {
  console.error('Function.prototype.bind not available. ' + 'ES5 shim required. ' + 'https://github.com/spoike/refluxjs#es5');
}
