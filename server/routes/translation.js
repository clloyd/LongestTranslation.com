var translateHandler = function(request, reply) {

  var languageCode = request.query.lang;
  var text = request.query.text;

  request.server.methods.getTranslation({code: languageCode, text: text}, function(err, translatedResp) {
    if (err) {
      reply(err).code(500);
      return;
    }

    reply(translatedResp);
  });
};

module.exports = {
    method: 'GET',
    path: '/translate',
    handler: translateHandler
};
