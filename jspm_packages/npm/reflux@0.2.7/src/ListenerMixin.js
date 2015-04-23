/* */ 
var _ = require("./utils"),
    ListenerMethods = require("./ListenerMethods");
module.exports = _.extend({componentWillUnmount: ListenerMethods.stopListeningToAll}, ListenerMethods);
