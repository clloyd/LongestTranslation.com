/* */ 
var Reflux = require("./index");
module.exports = function(listenable, callback, initial) {
  return {
    componentDidMount: function() {
      for (var m in Reflux.ListenerMethods) {
        if (this[m] !== Reflux.ListenerMethods[m]) {
          if (this[m]) {
            throw "Can't have other property '" + m + "' when using Reflux.listenTo!";
          }
          this[m] = Reflux.ListenerMethods[m];
        }
      }
      this.listenTo(listenable, callback, initial);
    },
    componentWillUnmount: Reflux.ListenerMethods.stopListeningToAll
  };
};
