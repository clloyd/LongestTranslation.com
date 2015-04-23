var yandexApiKey = "trnsl.1.1.20150423T183643Z.b6aedfea8975c09e.bbf8bad88643e7b055d6606c7f46975801ff1ccd";

var Hapi = require('hapi');
var SuperAgent = require('superagent');

var server = new Hapi.Server();
server.connection({ port: (process.env.PORT || 3000) });

server.views({
    engines: {
        html: require('handlebars')
    },
    path: __dirname
});

var translateHandler = function(request, reply) {
  var languageCode = request.query.lang;
  var text = request.query.text;

  SuperAgent.get('https://translate.yandex.net/api/v1.5/tr.json/translate')
  .query({'key': yandexApiKey})
  .query({'lang': 'en-' + languageCode})
  .query({'text': text})
  .end(function(err, res) {
    if (err) {
      reply('Error Getting Translation').code(500);
      return;
    }

    reply(res.body);

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
