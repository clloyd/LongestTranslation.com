if (!process.env.YANDEX_KEY) {
  throw Error('No YANDEX_KEY provided');
}

var Hapi = require('hapi');
var Path = require('path');

var getCacheOptions = function() {
  if (!process.env.REDISTOGO_URL) {
    return {};
  }

  var rtg = require('url').parse(process.env.REDISTOGO_URL);

  return {
    cache: {
      engine: require('catbox-redis'),
      host: rtg.hostname,
      port: rtg.port,
      password: rtg.auth.split(':')[1]
    }
  };
};

var server = new Hapi.Server(getCacheOptions());

server.connection({ port: (process.env.PORT || 3000) });
server.views({
    engines: {
        html: require('handlebars')
    },
    path: Path.join(__dirname, 'views')
});

server.method({
  options: {
    cache: {
      expiresIn: 6000000,
      staleIn: 5000000,
      staleTimeout: 20
    },
    generateKey: function(translate) {
      return translate.code + '-' + translate.text.toLowerCase();
    }
  },
  name: 'getTranslation',
  method: require('./methods/fetchTranslation.js')
});

server.route([
  require('./routes/translation.js'),
  require('./routes/index.js'),
  require('./routes/static.js')
]);

module.exports = server;
