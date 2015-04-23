/* */ 
var Reflux = require("./index");
module.exports = function(listenables) {
  return {
    componentDidMount: function() {
      for (var m in Reflux.ListenerMethods) {
        if (this[m] !== Reflux.ListenerMethods[m]) {
          if (this[m]) {
            throw "Can't have other property '" + m + "' when using Reflux.listenToMany!";
          }
          this[m] = Reflux.ListenerMethods[m];
        }
      }
      this.listenToMany(listenables);
    },
    componentWillUnmount: Reflux.ListenerMethods.stopListeningToAll
  };
};
