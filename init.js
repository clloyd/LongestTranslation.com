if (!process.env.YANDEX_KEY) {
  throw Error('No YANDEX_KEY provided');
}

var server = require('./server/server.js');

server.start(function () {
    console.log('Server running at: ', server.info.uri);
});
