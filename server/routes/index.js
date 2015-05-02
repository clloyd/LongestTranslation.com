module.exports = {
    method: 'GET',
    path: '/',
    handler: function(request, reply) {
      reply.view('index.html', {
        production: process.env.NODE_ENV === 'production' ? true : false
      });
    }
};
