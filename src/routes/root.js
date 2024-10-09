'use strict';

const FILES = require('../data/json/files.json');

module.exports = async function frontend (fastify, opts) {
  const indexHTML = fastify.fileCache.getFile(FILES.HTML_INDEX);

  if (indexHTML == null) {
    throw new Error('Could not serve a cached index.html file');
  }

  // Define the Fastify route
  fastify.get('/', async (request, reply) => {
    reply
      .code(200)
      .header('X-Robots-Tag', 'noindex, nofollow')
      .type('text/html')
      .send(indexHTML);
  });
};
