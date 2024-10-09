'use strict';
const fp = require('fastify-plugin');
const FILES = require('../data/json/files.json');
const PLUGINS = require('../data/json/plugins.json');

function notFound (fastify, options, done) {
  fastify.decorate('sendNotFound', (request, reply) => {
    const file = fastify.fileCache.getFile(FILES.HTML_404);
    if (file != null) {
      reply.code(404).type('text/html').send(file);
    } else {
      reply.notFound();
    }
  });

  fastify.setNotFoundHandler(fastify.sendNotFound);
  done();
}

module.exports = fp(notFound, PLUGINS.notFound.options);
