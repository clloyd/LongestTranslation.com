var yandexApiKey = process.env.YANDEX_KEY;

var Hapi = require('hapi');
var SuperAgent = require('superagent');

var options = {}

if (process.env.REDISTOGO_URL) {
  var rtg = require("url").parse(process.env.REDISTOGO_URL)
  options = {
    cache: {
      engine: require('catbox-redis'),
      host: rtg.hostname,
      port: rtg.port,
      password: rtg.auth.split(":")[1]
    }
  };
}

var server = new Hapi.Server(options);
server.connection({ port: (process.env.PORT || 3000) });

server.views({
    engines: {
        html: require('handlebars')
    },
    path: __dirname
});

var getTranslation = function(translate, next) {

  SuperAgent.get('https://translate.yandex.net/api/v1.5/tr.json/translate')
  .query({'key': yandexApiKey})
  .query({'lang': 'en-' + translate.code})
  .query({'text': translate.text})
  .end(function(err, res) {
    if (err) {
      next(err);
      return;
    }


    next(false, res.body);

  });

};

server.method({
  cache: {
    expiresIn: 6000000,
    staleIn: 5000000
  },
  name: 'getTranslation',
  method: getTranslation,
  generateKey: function(translate) {
    return translate.code + "-" + translate.text;
  }
});

var translateHandler = function(request, reply){
  var languageCode = request.query.lang;
  var text = request.query.text;

  server.methods.getTranslation({code: languageCode, text: text}, function(err, translatedResp){
    if (err) {
      reply('Error Getting Translation').code(500);
    }

    reply(translatedResp);
  });
};

server.route({
    method: 'GET',
    path: '/',
    handler: function(request, reply) {
      reply.view('index.html', {
        production: process.env.NODE_ENV === 'production' ? true : false
      });
    }
});

server.route({
    method: 'GET',
    path: '/translate',
    handler: translateHandler
});

server.route({
    method: 'GET',
    path: '/{param*}',
    handler: {
        directory: {
            path: '.',
            lookupCompressed: true
        }
    }
});

server.start(function () {
    console.log('Server running at:', server.info.uri);
});
