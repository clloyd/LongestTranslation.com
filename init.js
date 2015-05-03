var server = require('./server/server.js');

server.start(function () {
    console.log('Server running at: ', server.info.uri);
});
