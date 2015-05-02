var SuperAgent = require('superagent');
var yandexApiKey = process.env.YANDEX_KEY;

module.exports = function(word, next) {

  if (word.length > 20) {
    next(new Error('Word is too long'));
    return;
  }

  SuperAgent.get('https://translate.yandex.net/api/v1.5/tr.json/translate')
  .query({'key': yandexApiKey})
  .query({'lang': 'en-' + word.code})
  .query({'text': word.text.toLowerCase()})
  .end(function(err, res) {
    if (err) {
      next(err);
      return;
    }
    next(false, res.body);
  });

};
